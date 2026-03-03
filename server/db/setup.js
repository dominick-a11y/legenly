const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'legenly.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function addColumnIfNotExists(table, column, definition) {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  } catch {
    // Column already exists — ignore
  }
}

function setup() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS markets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      cities TEXT NOT NULL,
      status TEXT DEFAULT 'available'
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'subscriber',
      market TEXT,
      name TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      city TEXT,
      state TEXT,
      jobType TEXT,
      description TEXT,
      market TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      assignedTo INTEGER,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      userName TEXT NOT NULL,
      market TEXT NOT NULL,
      message TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS lead_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      leadId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      note TEXT,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(leadId, userId),
      FOREIGN KEY (leadId) REFERENCES leads(id),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS onboarding (
      userId INTEGER PRIMARY KEY,
      dismissed INTEGER DEFAULT 0,
      dismissedAt DATETIME,
      FOREIGN KEY (userId) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS post_likes (
      postId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      UNIQUE(postId, userId),
      FOREIGN KEY (postId) REFERENCES posts(id),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS lead_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      leadId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      remindAt TEXT NOT NULL,
      note TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (leadId) REFERENCES leads(id),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS waitlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      city TEXT NOT NULL,
      monthlyRevenue TEXT,
      leadSources TEXT,
      monthlyLeadSpend TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bundle_reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      city TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS webinar_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      business TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pipeline_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      source TEXT DEFAULT 'Other',
      stage TEXT DEFAULT 'new',
      notes TEXT,
      followUpAt TEXT,
      dealValue REAL DEFAULT 997,
      addedBy INTEGER,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (addedBy) REFERENCES users(id)
    );
  `);

  // Add new columns to existing tables if they don't exist — must run BEFORE upserts
  addColumnIfNotExists('leads', 'assignedMarket', 'TEXT');
  addColumnIfNotExists('users', 'isFounder', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('users', 'phone', 'TEXT');
  addColumnIfNotExists('users', 'jobFocus', 'TEXT');
  addColumnIfNotExists('markets', 'status', "TEXT DEFAULT 'available'");
  addColumnIfNotExists('posts', 'tag', 'TEXT');
  addColumnIfNotExists('posts', 'parentId', 'INTEGER');
  addColumnIfNotExists('posts', 'pinned', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('posts', 'likeCount', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('users', 'stripeCustomerId', 'TEXT');
  addColumnIfNotExists('users', 'stripeSubscriptionId', 'TEXT');
  addColumnIfNotExists('users', 'subscriptionStatus', "TEXT DEFAULT 'none'");
  addColumnIfNotExists('waitlist', 'status', "TEXT DEFAULT 'new'");
  addColumnIfNotExists('waitlist', 'notes', 'TEXT');

  // Ensure all markets exist and city lists are current.
  // ON CONFLICT DO UPDATE ensures existing markets get updated city lists on restart.
  const upsertMarket = db.prepare(`
    INSERT INTO markets (name, cities, status) VALUES (?, ?, 'available')
    ON CONFLICT(name) DO UPDATE SET cities = excluded.cities
  `);
  const defaultMarkets = [
    // Forsyth County GA — expanded to cover adjacent cities Hunter's ads may reach
    ['Forsyth County GA', 'Cumming,Alpharetta,Johns Creek,Suwanee,Milton,Gainesville,Dawsonville'],
    ['North Atlanta GA', 'Roswell,Sandy Springs,Dunwoody,Brookhaven'],
    ['Gwinnett County GA', 'Lawrenceville,Duluth,Buford,Sugar Hill'],
    ['Cherokee County GA', 'Canton,Woodstock,Ball Ground,Holly Springs'],
    ['Cobb County GA', 'Marietta,Smyrna,Kennesaw,Acworth'],
    ['North Dallas TX', 'Plano,Frisco,Allen,McKinney'],
    ['South Charlotte NC', 'Pineville,Matthews,Ballantyne,Fort Mill'],
    ['North Charlotte NC', 'Huntersville,Cornelius,Davidson,Mooresville'],
    ['Nashville TN', 'Brentwood,Franklin,Nolensville,Spring Hill'],
    ['North Tampa FL', 'Wesley Chapel,Zephyrhills,Land O Lakes,Lutz'],
  ];
  for (const [name, cities] of defaultMarkets) upsertMarket.run(name, cities);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    console.log('[DB] Seeding database...');

    const adminHash = bcrypt.hashSync('admin123', 10);
    const hunterHash = bcrypt.hashSync('hunter123', 10);

    db.prepare(
      "INSERT INTO users (email, password, role, name, isFounder) VALUES (?, ?, 'admin', ?, 1)"
    ).run('admin@legenly.io', adminHash, 'Admin');

    const hunterRow = db.prepare(
      "INSERT INTO users (email, password, role, market, name, isFounder) VALUES (?, ?, 'subscriber', ?, ?, 1)"
    ).run('hunter@legenly.io', hunterHash, 'Forsyth County GA', 'Hunter');

    console.log('[DB] Seed complete: admin, 1 subscriber, 1 market');
  }
}

module.exports = { db, setup };
