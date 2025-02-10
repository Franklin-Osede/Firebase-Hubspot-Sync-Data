require('dotenv').config();
const functions = require('firebase-functions');
const syncUsersService = require('./services/syncUsersService');

// Función HTTP existente para sincronizar usuarios desde Excel a Firebase
exports.syncUsers = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutos
    memory: '1GB',
    maxInstances: 1 // Asegurar que solo se ejecuta una instancia a la vez
  })
  .https.onRequest(async (req, res) => {
    // Verificar método HTTP
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Método no permitido. Use POST.'
      });
    }

    try {
      console.log('Iniciando proceso de sincronización...');

      // Ejecutar la sincronización
      const result = await syncUsersService.syncUsersFromExcel();

      // Procesar resultados
      if (result.success) {
        console.log(`Sincronización completada: ${result.updatedCount} actualizaciones, ${result.errorCount} errores`);

        // Si hay errores, incluir solo los primeros 100 en la respuesta
        if (result.errors && result.errors.length > 100) {
          result.errors = result.errors.slice(0, 100);
          result.message += ' (Mostrando primeros 100 errores)';
        }

        // Enviar respuesta exitosa
        res.status(200).json({
          success: true,
          updatedCount: result.updatedCount,
          errorCount: result.errorCount,
          timeElapsedSeconds: result.timeElapsedSeconds,
          message: result.message,
          errors: result.errors || []
        });
      } else {
        // Si la sincronización falló pero no lanzó una excepción
        console.error('La sincronización falló:', result.error);
        res.status(500).json({
          success: false,
          message: 'Error en la sincronización de usuarios',
          error: result.error
        });
      }
    } catch (error) {
      // Manejar errores inesperados
      console.error('Error inesperado en la sincronización de usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error inesperado en la sincronización de usuarios',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    } finally {
      console.log('Proceso de sincronización finalizado');
    }
  });

// Nueva función programada para ejecutar cada 2 minutos
exports.scheduledSyncBatch = functions
  .runWith({
    timeoutSeconds: 120, // 2 minutos
    memory: '256MB',
    maxInstances: 1
  })
  .pubsub.schedule('every 2 minutes')
  .timeZone('Europe/Madrid')  // Zona horaria europea
  .onRun(async (context) => {
    try {
      console.log('Iniciando sincronización programada de lote...');
      const result = await syncUsersService.syncNextBatch();

      // Log detallado del resultado
      if (result.success) {
        console.log(`Lote sincronizado exitosamente:
          - Procesados: ${result.batchProcessed}
          - Total usuarios: ${result.totalUsers}
          - Posición actual: ${result.currentPosition}
          - Actualizados: ${result.updatedCount}
          - Errores: ${result.errorCount}
          - Tiempo: ${result.timeElapsedSeconds.toFixed(2)}s`);
      } else {
        console.error('Error en la sincronización del lote:', result.error);
      }

      return null;
    } catch (error) {
      console.error('Error inesperado en la sincronización programada:', error);
      throw error;
    }
  });