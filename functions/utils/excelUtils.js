require('dotenv').config(); // Cargar variables de entorno desde .env
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

exports.readExcel = async () => {
  try {
    // Obtener la ruta del archivo Excel desde la variable de entorno
    const excelFilePath = process.env.EXCEL_FILE_PATH;

    if (!excelFilePath) {
      throw new Error('La variable EXCEL_FILE_PATH no está definida en .env');
    }

    // Construir la ruta absoluta al archivo Excel
    const filePath = path.resolve(excelFilePath);

    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
      throw new Error(`Archivo Excel no encontrado en ${filePath}`);
    }

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
    console.error('Error leyendo el archivo Excel:', error.message);
    throw new Error('Error leyendo el archivo Excel.');
  }
};