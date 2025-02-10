require('dotenv').config(); // load environment variables from .env
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

exports.readExcel = async () => {
  try {
    // Get the Excel file path from the environment variable.
    const excelFilePath = process.env.EXCEL_FILE_PATH;

    if (!excelFilePath) {
      throw new Error('La variable EXCEL_FILE_PATH no está definida en .env');
    }

    // Build the absolute path to the Excel file.
    const filePath = path.resolve(excelFilePath);

    // Check if the file exists.
    if (!fs.existsSync(filePath)) {
      throw new Error(`Archivo Excel no encontrado en ${filePath}`);
    }

    // Read the Excel file.
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

    // Get the first page
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert data JSON
    const usersData = xlsx.utils.sheet_to_json(sheet);
    return usersData;
  } catch (error) {
    console.error('Error leyendo el archivo Excel:', error.message);
    throw new Error('Error leyendo el archivo Excel.');
  }
};