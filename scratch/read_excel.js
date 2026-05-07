const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const folderPath = 'E:/ATTENDANCE SHEET';
const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.xlsx'));

files.forEach(file => {
    console.log(`--- FILE: ${file} ---`);
    const workbook = XLSX.readFile(path.join(folderPath, file));
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log(JSON.stringify(data.slice(0, 5), null, 2)); // Show first 5 rows
});
