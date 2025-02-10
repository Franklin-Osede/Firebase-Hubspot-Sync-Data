// Aumentar el timeout global
jest.setTimeout(10000);

// Limpiar mocks después de cada prueba
afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

// Limpiar todo después de todas las pruebas
afterAll(async () => {
  // Esperar a que se completen todas las operaciones pendientes
  await new Promise(resolve => setTimeout(resolve, 500));
});

// Silenciar los console.warn y console.error durante las pruebas
// Comenta estas líneas si necesitas ver los mensajes durante el desarrollo
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => { });
  jest.spyOn(console, 'error').mockImplementation(() => { });
});