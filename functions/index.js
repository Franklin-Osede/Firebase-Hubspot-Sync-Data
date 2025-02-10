require('dotenv').config();
const functions = require('firebase-functions');
const syncUsersService = require('./services/syncUsersService');

// Existing HTTP function to synchronize users from Excel to Firebase
exports.syncUsers = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes
    memory: '1GB',
    maxInstances: 1 // Ensure that only one instance runs at a time.
  })
  .https.onRequest(async (req, res) => {
    // Check HTTP method.
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        message: 'Método no permitido. Use POST.'
      });
    }

    try {
      console.log('Iniciando proceso de sincronización...');

      // Run the synchronization.
      const result = await syncUsersService.syncUsersFromExcel();

      // Process results.
      if (result.success) {
        console.log(`Sincronización completada: ${result.updatedCount} actualizaciones, ${result.errorCount} errores`);

        // If there are errors, include only the first 100 in the response.
        if (result.errors && result.errors.length > 100) {
          result.errors = result.errors.slice(0, 100);
          result.message += ' (Mostrando primeros 100 errores)';
        }

        // Send successful response.
        res.status(200).json({
          success: true,
          updatedCount: result.updatedCount,
          errorCount: result.errorCount,
          timeElapsedSeconds: result.timeElapsedSeconds,
          message: result.message,
          errors: result.errors || []
        });
      } else {
        // If the synchronization failed but did not throw an exception.
        console.error('La sincronización falló:', result.error);
        res.status(500).json({
          success: false,
          message: 'Error en la sincronización de usuarios',
          error: result.error
        });
      }
    } catch (error) {
      // Handle unexpected errors.
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

// New scheduled function to run every 2 minutes.
exports.scheduledSyncBatch = functions
  .runWith({
    timeoutSeconds: 120, // 2 minutes
    memory: '256MB',
    maxInstances: 1
  })
  .pubsub.schedule('every 2 minutes')
  .timeZone('Europe/Madrid')  // European time zone.
  .onRun(async (context) => {
    try {
      console.log('Iniciando sincronización programada de lote...');
      const result = await syncUsersService.syncNextBatch();

      // Detailed log of the result.
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