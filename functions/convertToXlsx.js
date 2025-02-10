const XLSX = require('xlsx');
const fs = require('fs');

// Leer el CSV
const workbook = XLSX.readFile('hubspot_contacts.csv');
const worksheet = workbook.Sheets[workbook.SheetNames[0]];

// Renombrar las columnas para que coincidan con lo que espera el código
const jsonData = XLSX.utils.sheet_to_json(worksheet);
const renamedData = jsonData.map(row => ({
  email: row['Correo'],
  hubspotId: row['ID de registro']
}));

// Crear nuevo workbook con los datos renombrados
const newWorkbook = XLSX.utils.book_new();
const newWorksheet = XLSX.utils.json_to_sheet(renamedData);
XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Sheet1');

// Guardar como XLSX
XLSX.writeFile(newWorkbook, 'hubspot_contacts.xlsx');
console.log('Archivo convertido y guardado como hubspot_contacts.xlsx');