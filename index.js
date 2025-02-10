const functions = require('firebase-functions');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

exports.readExcel = functions.https.onRequest((req, res) => {
  try {
    // Ruta del archivo Excel
    const filePath = path.resolve(__dirname, '../hubspot_contacts.xlsx');

    // Verificar si el archivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Archivo Excel no encontrado.');
    }

    // Leer el archivo Excel
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

    // Obtener la primera hoja
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convertir la hoja a JSON
    const usersData = xlsx.utils.sheet_to_json(sheet);

    // Enviar los datos como respuesta
    res.status(200).json(usersData);
  } catch (error) {
    console.error('Error leyendo el archivo Excel:', error);
    res.status(500).send('Error leyendo el archivo Excel.');
  }
});
