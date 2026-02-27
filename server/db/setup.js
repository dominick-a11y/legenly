const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'legenly.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

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
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    console.log('[DB] Seeding database...');

    const adminHash = bcrypt.hashSync('admin123', 10);
    const hunterHash = bcrypt.hashSync('hunter123', 10);

    db.prepare("INSERT INTO markets (name, cities) VALUES (?, ?)").run(
      'Forsyth County GA',
      'Cumming,Alpharetta,Johns Creek,Suwanee'
    );

    db.prepare(
      "INSERT INTO users (email, password, role, name) VALUES (?, ?, 'admin', ?)"
    ).run('admin@legenly.io', adminHash, 'Admin');

    const hunterRow = db.prepare(
      "INSERT INTO users (email, password, role, market, name) VALUES (?, ?, 'subscriber', ?, ?)"
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
