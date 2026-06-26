import XLSX from 'xlsx';

const wb = XLSX.readFile("public/Directorio Central de Negocios  20260515.xlsx");
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

console.log(`Sheets: ${wb.SheetNames.join(', ')}`);
console.log(`Total rows: ${data.length}\n`);
data.forEach((row, i) => {
  if (row.length > 0) console.log(`Row ${i}:`, JSON.stringify(row));
});
