const syncUsersService = require('../services/syncUsersService');
const excelUtils = require('../utils/excelUtils');

// Aumentar el timeout para las pruebas
jest.setTimeout(10000);

// Mockear Firebase Admin
jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn()
  },
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      where: jest.fn(() => ({
        get: jest.fn(() =>
          Promise.resolve({
            empty: false,
            docs: [{
              ref: {
                update: jest.fn().mockResolvedValue(true)
              },
              data: () => ({
                email: 'user1@example.com',
                hubspotId: '12345'
              })
            }],
          })
        ),
      })),
    })),
  })),
}));

// Restaurar todos los mocks después de cada prueba
afterEach(async () => {
  jest.restoreAllMocks();
  process.env = { ...process.env }; // Restaurar variables de entorno
  await new Promise(resolve => setTimeout(resolve, 100));
});

describe('syncUsersService.syncUsersFromExcel', () => {
  beforeEach(() => {
    // Configurar variables de entorno necesarias para Firebase
    process.env.TYPE = 'service_account';
    process.env.PROJECT_ID = 'test-project';
    process.env.PRIVATE_KEY_ID = 'test-key-id';
    process.env.PRIVATE_KEY = 'test-private-key';
    process.env.CLIENT_EMAIL = 'test@test.com';
    process.env.CLIENT_ID = 'test-client-id';
    process.env.AUTH_URI = 'https://test.com/auth';
    process.env.TOKEN_URI = 'https://test.com/token';
    process.env.AUTH_PROVIDER_CERT_URL = 'https://test.com/cert';
    process.env.CLIENT_CERT_URL = 'https://test.com/client-cert';
  });

  test('debe sincronizar usuarios correctamente', async () => {
    // Datos simulados para mockear readExcel
    const mockUsersData = [
      { email: 'user1@example.com', hubspotId: '12345' },
      { email: 'user2@example.com', hubspotId: '67890' },
    ];

    // Mockear la función readExcel
    jest.spyOn(excelUtils, 'readExcel').mockResolvedValue(mockUsersData);

    const result = await syncUsersService.syncUsersFromExcel();

    expect(result.success).toBe(true);
    expect(result.updatedCount).toBe(2);
    expect(result.errorCount).toBe(0);
    expect(result.message).toBe('Sincronización completada - Actualizados: 2, Errores: 0');
  });

  test('debe manejar registros incompletos', async () => {
    // Datos simulados con un registro incompleto
    const mockUsersData = [
      { email: 'user1@example.com', hubspotId: '12345' },
      { email: '', hubspotId: '' }, // Registro incompleto
    ];

    // Mockear la función readExcel
    jest.spyOn(excelUtils, 'readExcel').mockResolvedValue(mockUsersData);

    const result = await syncUsersService.syncUsersFromExcel();

    expect(result.success).toBe(true);
    expect(result.updatedCount).toBe(1);
    expect(result.errorCount).toBe(1);
    expect(result.message).toBe('Sincronización completada - Actualizados: 1, Errores: 1');
  });

  test('debe manejar errores durante la sincronización', async () => {
    // Simular un error al leer el archivo Excel
    jest.spyOn(excelUtils, 'readExcel').mockRejectedValue(new Error('Error leyendo Excel'));

    const result = await syncUsersService.syncUsersFromExcel();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Error leyendo Excel');
    expect(result.updatedCount).toBe(0);
    expect(result.errorCount).toBe(0);
  });
});