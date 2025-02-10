const excelUtils = require('../utils/excelUtils');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const os = require('os');

// Aumentar el timeout para las pruebas
jest.setTimeout(10000);

// Crear ruta para directorio temporal
const tempDir = path.join(os.tmpdir(), 'test-excel-files');

// Configuración previa a todas las pruebas
beforeAll(() => {
  // Crear directorio temporal si no existe
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  // Crear ruta para el archivo mock
  const mockFilePath = path.join(tempDir, 'mock-hubspot_contacts.xlsx');

  // Crear nuevo workbook
  const workbook = XLSX.utils.book_new();
  const wsData = [
    ['email', 'hubspotId'],
    ['user1@example.com', '12345'],
    ['user2@example.com', '67890']
  ];

  // Crear worksheet y añadirlo al workbook
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(workbook, ws, 'Sheet1');

  // Escribir archivo Excel
  XLSX.writeFile(workbook, mockFilePath);

  // Configurar variable de entorno
  process.env.EXCEL_FILE_PATH = mockFilePath;
});

// Limpieza después de todas las pruebas
afterAll(async () => {
  // Eliminar directorio temporal y su contenido
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
  // Esperar a que se completen todas las operaciones pendientes
  await new Promise(resolve => setTimeout(resolve, 100));
});

// Restaurar todos los mocks después de cada prueba
afterEach(() => {
  jest.restoreAllMocks();
});

describe('excelUtils.readExcel', () => {
  test('debe leer correctamente el archivo Excel', async () => {
    const usersData = await excelUtils.readExcel();

    // Verificar estructura y contenido del resultado
    expect(usersData).toBeInstanceOf(Array);
    expect(usersData.length).toBe(2);
    expect(usersData[0]).toEqual({
      email: 'user1@example.com',
      hubspotId: '12345'
    });
    expect(usersData[1]).toEqual({
      email: 'user2@example.com',
      hubspotId: '67890'
    });
  });

  test('debe manejar errores si el archivo no existe', async () => {
    // Guardar ruta original
    const oldPath = process.env.EXCEL_FILE_PATH;

    // Cambiar a ruta no existente
    process.env.EXCEL_FILE_PATH = path.join(tempDir, 'non-existent.xlsx');

    // Verificar que se lanza el error esperado
    await expect(excelUtils.readExcel()).rejects.toThrow('Error leyendo el archivo Excel.');

    // Restaurar ruta original
    process.env.EXCEL_FILE_PATH = oldPath;
  });
});