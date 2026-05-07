const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const db = require('./database');

async function importAttendance() {
    const folderPath = 'E:/ATTENDANCE SHEET';
    const files = ['attandance january 2026.xlsx', 'vishal attandence sheet march 2026.xlsx'];
    
    for (const file of files) {
        const filePath = path.join(folderPath, file);
        if (!fs.existsSync(filePath)) continue;
        
        console.log(`Processing ${file}...`);
        const workbook = XLSX.readFile(filePath);
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const name = row['__EMPTY_3']?.trim();
            const statusRaw = row['__EMPTY_5']?.trim() || 'Absent';
            const dateSerial = row['__EMPTY'];
            
            if (!name || typeof dateSerial !== 'number') continue;
            
            // Map status
            let status = 'Absent';
            if (statusRaw.toLowerCase().includes('present')) status = 'Present';
            if (statusRaw.toLowerCase().includes('holiday')) status = 'Holiday';
            if (statusRaw.toLowerCase().includes('sunday')) status = 'Holiday';
            
            // Map times
            const inTimeSerial = row['__EMPTY_1'];
            const outTimeSerial = row['__EMPTY_2'];
            
            const formatTime = (serial) => {
                if (typeof serial === 'string') return serial;
                if (typeof serial !== 'number') return '-';
                const totalSeconds = Math.round(serial * 24 * 3600);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const ampm = hours >= 12 ? 'PM' : 'AM';
                const h12 = hours % 12 || 12;
                return `${String(h12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
            };
            
            const checkIn = formatTime(inTimeSerial);
            const checkOut = formatTime(outTimeSerial);
            
            const date = new Date((dateSerial - 25569) * 86400 * 1000).toISOString().split('T')[0];
            
            // Find employee
            const [firstName, ...lastNameParts] = name.split(' ');
            const lastName = lastNameParts.join(' ') || '-';
            const empRes = await db.query('SELECT id FROM employees WHERE LOWER(firstName) = LOWER($1) AND LOWER(lastName) = LOWER($2)', [firstName, lastName]);
            
            if (empRes.rows.length > 0) {
                const empId = empRes.rows[0].id;
                // Delete existing for this day to avoid duplicates
                await db.query('DELETE FROM attendance WHERE empId = $1 AND date = $2', [empId, date]);
                // Insert
                await db.query('INSERT INTO attendance (empId, date, status, checkIn, checkOut, ot) VALUES ($1, $2, $3, $4, $5, $6)',
                    [empId, date, status, checkIn, checkOut, 0]);
            }
        }
    }
    console.log('--- ATTENDANCE IMPORT COMPLETED ---');
    process.exit(0);
}

importAttendance().catch(err => {
    console.error(err);
    process.exit(1);
});
