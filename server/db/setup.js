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
      cities TEXT NOT NULL
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
  `);

  // Ensure all markets exist (safe to run on existing databases)
  const upsertMarket = db.prepare(
    "INSERT OR IGNORE INTO markets (name, cities, status) VALUES (?, ?, 'available')"
  );
  const defaultMarkets = [
    ['Forsyth County GA', 'Cumming,Alpharetta,Johns Creek,Suwanee'],
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

  // Add new columns to existing tables if they don't exist
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

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    console.log('[DB] Seeding database...');

    const adminHash = bcrypt.hashSync('admin123', 10);
    const hunterHash = bcrypt.hashSync('hunter123', 10);

    const insertMarket = db.prepare("INSERT INTO markets (name, cities, status) VALUES (?, ?, 'available')");
    insertMarket.run('Forsyth County GA', 'Cumming,Alpharetta,Johns Creek,Suwanee');
    insertMarket.run('North Atlanta GA', 'Roswell,Sandy Springs,Dunwoody,Brookhaven');
    insertMarket.run('Gwinnett County GA', 'Lawrenceville,Duluth,Buford,Sugar Hill');
    insertMarket.run('Cherokee County GA', 'Canton,Woodstock,Ball Ground,Holly Springs');
    insertMarket.run('Cobb County GA', 'Marietta,Smyrna,Kennesaw,Acworth');
    insertMarket.run('North Dallas TX', 'Plano,Frisco,Allen,McKinney');
    insertMarket.run('South Charlotte NC', 'Pineville,Matthews,Ballantyne,Fort Mill');
    insertMarket.run('North Charlotte NC', 'Huntersville,Cornelius,Davidson,Mooresville');
    insertMarket.run('Nashville TN', 'Brentwood,Franklin,Nolensville,Spring Hill');
    insertMarket.run('North Tampa FL', 'Wesley Chapel,Zephyrhills,Land O Lakes,Lutz');

    db.prepare(
      "INSERT INTO users (email, password, role, name, isFounder) VALUES (?, ?, 'admin', ?, 1)"
    ).run('admin@legenly.io', adminHash, 'Admin');

    const hunterRow = db.prepare(
      "INSERT INTO users (email, password, role, market, name, isFounder) VALUES (?, ?, 'subscriber', ?, ?, 1)"
    ).run('hunter@legenly.io', hunterHash, 'Forsyth County GA', 'Hunter');

    const hunterId = hunterRow.lastInsertRowid;

    const insertLead = db.prepare(`
      INSERT INTO leads (name, phone, email, city, state, jobType, description, market, status, assignedTo)
      VALUES (@name, @phone, @email, @city, @state, @jobType, @description, @market, @status, @assignedTo)
    `);

    const seedLeads = [
      {
        name: 'Sarah Johnson',
        phone: '770-555-0101',
        email: 'sarah.j@email.com',
        city: 'Cumming',
        state: 'GA',
        jobType: 'Garage',
        description: 'Full garage cleanout — about 3 truck loads of old furniture, boxes, and miscellaneous junk.',
        status: 'new',
        market: 'Forsyth County GA',
        assignedTo: hunterId
      },
      {
        name: 'Mike Davis',
        phone: '770-555-0102',
        email: 'mike.d@email.com',
        city: 'Alpharetta',
        state: 'GA',
        jobType: 'Estate',
        description: 'Full estate cleanout after passing of family member. Entire home contents need to be hauled.',
        status: 'new',
        market: 'Forsyth County GA',
        assignedTo: hunterId
      },
      {
        name: 'Linda Chen',
        phone: '770-555-0103',
        email: 'linda.c@email.com',
        city: 'Johns Creek',
        state: 'GA',
        jobType: 'Appliance',
        description: 'Removing old refrigerator, washer, dryer, and dishwasher from kitchen renovation.',
        status: 'called',
        market: 'Forsyth County GA',
        assignedTo: hunterId
      },
      {
        name: 'Tom Wilson',
        phone: '770-555-0104',
        email: 'tom.w@email.com',
        city: 'Suwanee',
        state: 'GA',
        jobType: 'Commercial',
        description: 'Office cleanout after business closure — desks, chairs, filing cabinets, IT equipment.',
        status: 'called',
        market: 'Forsyth County GA',
        assignedTo: hunterId
      },
      {
        name: 'Amy Parker',
        phone: '770-555-0105',
        email: 'amy.p@email.com',
        city: 'Cumming',
        state: 'GA',
        jobType: 'Garage',
        description: 'Garage and attic cleanout. Old gym equipment, holiday decorations, and general clutter.',
        status: 'closed',
        market: 'Forsyth County GA',
        assignedTo: hunterId
      },
      {
        name: 'Robert Kim',
        phone: '770-555-0106',
        email: 'robert.k@email.com',
        city: 'Alpharetta',
        state: 'GA',
        jobType: 'Estate',
        description: 'Full house cleanout after move-out. Everything left behind needs removal — multiple trips.',
        status: 'new',
        market: 'Forsyth County GA',
        assignedTo: hunterId
      }
    ];

    for (const lead of seedLeads) {
      insertLead.run(lead);
    }

    console.log('[DB] Seed complete: admin, 1 subscriber, 1 market, 6 leads');
  }
}

module.exports = { db, setup };
