const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const db = require('./database');

async function importData() {
    const folderPath = 'E:/ATTENDANCE SHEET';
    
    // 1. Get Employee Info from Salary Sheet
    const salaryFile = path.join(folderPath, 'salary sheet March month 2026.xlsx');
    const salaryWorkbook = XLSX.readFile(salaryFile);
    const salaryData = XLSX.utils.sheet_to_json(salaryWorkbook.Sheets[salaryWorkbook.SheetNames[0]]);
    
    console.log(`Found ${salaryData.length} entries in salary sheet.`);
    
    for (const row of salaryData) {
        const fullName = row['Name ']?.trim();
        if (!fullName) continue;
        
        const [firstName, ...lastNameParts] = fullName.split(' ');
        const lastName = lastNameParts.join(' ') || '-';
        const basicSalaryStr = String(row['Basic Salary'] || '0');
        // Handle formulas like "24000+9450"
        let basicSalary = 0;
        try {
            basicSalary = eval(basicSalaryStr.replace(/[^\d+*-/.]/g, '')) || 0;
        } catch(e) {
            basicSalary = parseFloat(basicSalaryStr) || 0;
        }
        
        // Check if employee exists (case-insensitive)
        const existing = await db.query('SELECT id FROM employees WHERE LOWER(firstName) = LOWER($1) AND LOWER(lastName) = LOWER($2)', [firstName, lastName]);
        
        let empId;
        if (existing.rows.length > 0) {
            empId = existing.rows[0].id;
            console.log(`Employee ${fullName} already exists with ID: ${empId}`);
        } else {
            // Generate ID based on MAX
            const maxIdRes = await db.query("SELECT id FROM employees WHERE id LIKE 'EMP%' ORDER BY id DESC LIMIT 1");
            let nextNum = 1;
            if (maxIdRes.rows.length > 0) {
                nextNum = parseInt(maxIdRes.rows[0].id.replace('EMP', '')) + 1;
            }
            empId = `EMP${String(nextNum).padStart(3, '0')}`;
            
            await db.query(`INSERT INTO employees (id, firstName, lastName, department, designation, basicSalary, joinDate, status, password, role) 
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, 
                            [empId, firstName, lastName, 'Staff', 'Employee', basicSalary, '2026-01-01', 'Active', '123456', 'employee']);
            console.log(`Created Employee: ${fullName} with ID: ${empId}`);
        }
        
        // Handle Advances from salary sheet
        const advanceStr = String(row['Advance Payment'] || '0');
        let advanceAmount = 0;
        try {
            advanceAmount = eval(advanceStr.replace(/[^\d+*-/.]/g, '')) || 0;
        } catch(e) {
            advanceAmount = parseFloat(advanceStr) || 0;
        }
        
        if (advanceAmount > 0) {
            await db.query('INSERT INTO advances (id, empId, month, amount, date, reason, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [`A${Date.now()}_${empId}`, empId, '2026-03', advanceAmount, '2026-03-15', 'Imported Advance', 'Approved']);
        }
    }
    
    // 2. Handle Office Expenses (Vishal Sharma)
    const expenseFile = path.join(folderPath, 'vishal office expenses march 2026.xlsx');
    if (fs.existsSync(expenseFile)) {
        const expenseWorkbook = XLSX.readFile(expenseFile);
        const expenseData = XLSX.utils.sheet_to_json(expenseWorkbook.Sheets[expenseWorkbook.SheetNames[0]]);
        // Row 0 is header
        for (let i = 1; i < expenseData.length; i++) {
            const row = expenseData[i];
            const amount = parseFloat(row['__EMPTY_1']) || 0;
            const reason = row['__EMPTY_2'] || 'Office Expense';
            const dateValue = row['__EMPTY']; // Excel date serial
            
            if (amount > 0) {
                const date = dateValue ? new Date((dateValue - 25569) * 86400 * 1000).toISOString().split('T')[0] : '2026-03-01';
                await db.query('INSERT INTO expenses (id, empId, month, amount, date, reason, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [`E${Date.now()}_${i}`, 'EMP002', '2026-03', amount, date, reason, 'Approved']);
            }
        }
    }

    console.log('--- IMPORT COMPLETED ---');
    process.exit(0);
}

importData().catch(err => {
    console.error(err);
    process.exit(1);
});
