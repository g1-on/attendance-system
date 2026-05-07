const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');
const XLSX = require('xlsx');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// API Endpoints

// Employees
app.get('/api/employees', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM employees');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const id = req.body.id ? req.body.id.trim() : '';
  const password = req.body.password;
  try {
    const result = await db.query('SELECT * FROM employees WHERE LOWER(id) = LOWER($1) AND password = $2', [id, password]);
    const user = result.rows[0];
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: 'Invalid ID or Password' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/employees', async (req, res) => {
  const { id, firstName, lastName, department, designation, basicSalary, joinDate, email, phone, status, password, role } = req.body;
  try {
    await db.query(`
      INSERT INTO employees (id, firstName, lastName, department, designation, basicSalary, joinDate, email, phone, status, password, role)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [id, firstName, lastName, department, designation, basicSalary, joinDate, email, phone, status, password || '123456', role || 'employee']);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query('UPDATE employees SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE employees SET status = $1 WHERE id = $2', ['Archived', id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Attendance
app.get('/api/attendance', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM attendance');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/attendance', async (req, res) => {
  const { empId, date, status, checkIn, checkOut, ot } = req.body;
  try {
    await db.query(`
      INSERT INTO attendance ("empId", date, status, "checkIn", "checkOut", ot)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT ("empId", date) DO UPDATE 
      SET status = EXCLUDED.status, "checkIn" = EXCLUDED."checkIn", "checkOut" = EXCLUDED."checkOut", ot = EXCLUDED.ot
    `, [empId, date, status, checkIn, checkOut, ot]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leave Requests
app.get('/api/leave-requests', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM leave_requests');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/leave-requests', async (req, res) => {
  const { id, empId, type, from, to, days, reason, applied, status } = req.body;
  try {
    await db.query(`
      INSERT INTO leave_requests (id, "empId", type, "from", "to", days, reason, applied, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [id, empId, type, from, to, days, reason, applied, status]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/leave-requests/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query('UPDATE leave_requests SET status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Advances
app.get('/api/advances', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM advances');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/advances', async (req, res) => {
  const { id, empId, month, amount, date, reason, status } = req.body;
  try {
    await db.query(`
      INSERT INTO advances (id, "empId", month, amount, date, reason, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [id, empId, month, amount, date, reason, status]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM expenses');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  const { id, empId, month, amount, date, reason, status } = req.body;
  try {
    await db.query(`
      INSERT INTO expenses (id, "empId", month, amount, date, reason, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [id, empId, month, amount, date, reason, status]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Payroll
app.get('/api/payroll', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM payroll');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payroll', async (req, res) => {
  const { empId, month, basic, gross, advance, expense, totalDeductions, net, paymentStatus } = req.body;
  try {
    await db.query(`
      INSERT INTO payroll ("empId", month, basic, gross, advance, expense, "totalDeductions", net, "paymentStatus")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT ("empId", month) DO UPDATE 
      SET basic = EXCLUDED.basic, gross = EXCLUDED.gross, advance = EXCLUDED.advance, expense = EXCLUDED.expense, "totalDeductions" = EXCLUDED."totalDeductions", net = EXCLUDED.net, "paymentStatus" = EXCLUDED."paymentStatus"
    `, [empId, month, basic, gross, advance, expense, totalDeductions, net, paymentStatus]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/advances/:id', async (req, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body;
  try {
    await db.query('UPDATE advances SET amount = $1, reason = $2 WHERE id = $3', [amount, reason, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body;
  try {
    await db.query('UPDATE expenses SET amount = $1, reason = $2 WHERE id = $3', [amount, reason, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/advances/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM advances WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM expenses WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Excel Export
app.get('/api/export/:type', async (req, res) => {
  const { type } = req.params;
  try {
    let result;
    let fileName = '';

    if (type === 'employees') {
      result = await db.query('SELECT * FROM employees');
      fileName = 'Employees_Report.xlsx';
    } else if (type === 'attendance') {
      result = await db.query('SELECT * FROM attendance');
      fileName = 'Attendance_Report.xlsx';
    } else if (type === 'leave') {
      result = await db.query('SELECT * FROM leave_requests');
      fileName = 'Leave_Report.xlsx';
    } else if (type === 'payroll') {
      result = await db.query('SELECT * FROM payroll');
      fileName = 'Payroll_Report.xlsx';
    }

    const data = result.rows;
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${port}`);
});
