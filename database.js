const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_8SmCT4FcVvkJ@ep-misty-mouse-aqb5gh8y.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString,
});

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        firstName TEXT,
        lastName TEXT,
        department TEXT,
        designation TEXT,
        basicSalary INTEGER,
        joinDate TEXT,
        email TEXT,
        phone TEXT,
        status TEXT DEFAULT 'Active',
        password TEXT DEFAULT '123456',
        role TEXT DEFAULT 'employee',
        faceDescriptor TEXT,
        image TEXT
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        empId TEXT,
        date TEXT,
        status TEXT,
        checkIn TEXT,
        checkOut TEXT,
        ot REAL,
        UNIQUE(empId, date)
      );

      CREATE TABLE IF NOT EXISTS leave_requests (
        id TEXT PRIMARY KEY,
        empId TEXT,
        type TEXT,
        "from" TEXT,
        "to" TEXT,
        days INTEGER,
        reason TEXT,
        applied TEXT,
        status TEXT DEFAULT 'Pending'
      );

      CREATE TABLE IF NOT EXISTS advances (
        id TEXT PRIMARY KEY,
        empId TEXT,
        month TEXT,
        amount INTEGER,
        date TEXT,
        reason TEXT,
        status TEXT DEFAULT 'Approved'
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        empId TEXT,
        month TEXT,
        amount INTEGER,
        date TEXT,
        reason TEXT,
        status TEXT DEFAULT 'Approved'
      );

      CREATE TABLE IF NOT EXISTS payroll (
        empId TEXT,
        month TEXT,
        basic INTEGER,
        gross INTEGER,
        advance INTEGER,
        expense INTEGER,
        totalDeductions INTEGER,
        net INTEGER,
        paymentStatus TEXT,
        PRIMARY KEY(empId, month)
      );
    `);

    // Ensure Admin exists
    const res = await client.query("SELECT * FROM employees WHERE id = 'admin'");
    if (res.rows.length === 0) {
      await client.query(`
        INSERT INTO employees (id, firstName, lastName, department, designation, basicSalary, joinDate, email, phone, status, password, role)
        VALUES ('admin', 'System', 'Admin', 'Management', 'Administrator', 0, '2024-01-01', 'admin@office.com', '0000000000', 'Active', 'admin', 'admin')
      `);
    }
    console.log("Database initialized successfully");
  } finally {
    client.release();
  }
}

initDb().catch(err => console.error('Database initialization error', err));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
