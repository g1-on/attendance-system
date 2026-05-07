const db = require('./database');
async function fix() {
  try {
    await db.query("DELETE FROM employees WHERE LOWER(id) = 'admin'");
    await db.query(`
      INSERT INTO employees (id, firstName, lastName, department, designation, basicSalary, joinDate, email, phone, status, password, role)
      VALUES ('admin', 'System', 'Admin', 'Management', 'Administrator', 0, '2024-01-01', 'admin@office.com', '0000000000', 'Active', 'admin', 'admin')
    `);
    console.log('Admin account recreated successfully with password: admin');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fix();
