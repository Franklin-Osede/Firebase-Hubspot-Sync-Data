const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

exports.readExcel = async () => {
  try {
    // Ruta del archivo Excel
    const filePath = path.resolve(__dirname, '../path/to/your/excel-file.xlsx');

    // Leer el archivo Excel
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

    // Obtener la primera hoja
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convertir la hoja a JSON
    const usersData = xlsx.utils.sheet_to_json(sheet);

    return usersData;
  } catch (error) {
    console.error('Error leyendo el archivo Excel:', error);
    throw new Error('Error leyendo el archivo Excel.');
  }
};
