const XLSX = require('xlsx');
const fs = require('fs');

// Read the CSV
const workbook = XLSX.readFile('hubspot_contacts.csv');
const worksheet = workbook.Sheets[workbook.SheetNames[0]];

// Rename the columns to match what the code expects.
const jsonData = XLSX.utils.sheet_to_json(worksheet);
const renamedData = jsonData.map(row => ({
  email: row['Correo'],
  hubspotId: row['ID de registro']
}));

// Create a new workbook with the renamed data.
const newWorkbook = XLSX.utils.book_new();
const newWorksheet = XLSX.utils.json_to_sheet(renamedData);
XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Sheet1');

// Save as XLSX
XLSX.writeFile(newWorkbook, 'hubspot_contacts.xlsx');
console.log('Archivo convertido y guardado como hubspot_contacts.xlsx');