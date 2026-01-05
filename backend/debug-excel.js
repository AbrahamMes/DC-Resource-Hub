import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXCEL_PATH = path.join(__dirname, 'data/Asset List_Rev10.xlsx');

const workbook = XLSX.readFile(EXCEL_PATH);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('Total rows in Excel:', data.length);
console.log('\nFirst 5 asset names:');
data.slice(0, 5).forEach((row, i) => {
  console.log(`  ${i + 1}. Name field:`, row.Name);
});

console.log('\nColumn headers:', Object.keys(data[0] || {}));

console.log('\nSample row:');
console.log(JSON.stringify(data[0], null, 2));
