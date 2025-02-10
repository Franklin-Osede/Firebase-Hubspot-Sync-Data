require('dotenv').config();
const admin = require('firebase-admin');
const excelUtils = require('../utils/excelUtils');
const { processBatch } = require('../utils/batchUtils');

function initializeFirebase() {
  if (!admin.apps.length) {
    const serviceAccount = {
      type: process.env.TYPE,
      project_id: process.env.PROJECT_ID,
      private_key_id: process.env.PRIVATE_KEY_ID,
      private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.CLIENT_EMAIL,
      client_id: process.env.CLIENT_ID,
      auth_uri: process.env.AUTH_URI,
      token_uri: process.env.TOKEN_URI,
      auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_CERT_URL,
      client_x509_cert_url: process.env.CLIENT_CERT_URL,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

initializeFirebase();

const processUser = async (user) => {
  const usersRef = admin.firestore().collection('users');

  if (!user.email || !user.hubspotId) {
    throw new Error('Registro incompleto');
  }

  const snapshot = await usersRef.where('email', '==', user.email.toLowerCase()).get();

  if (!snapshot.empty) {
    await snapshot.docs[0].ref.update({
      hubspotId: user.hubspotId,
      lastSyncedWithHubspot: new Date().toISOString(),
    });
    return { status: 'updated', email: user.email };
  } else {
    throw new Error(`Usuario no encontrado: ${user.email}`);
  }
};

exports.syncUsersFromExcel = async () => {
  try {
    console.log('Iniciando sincronización de usuarios...');
    const startTime = Date.now();

    // Leer los datos del archivo Excel
    const usersData = await excelUtils.readExcel();
    console.log(`Leídos ${usersData.length} registros del Excel`);

    // Procesar en lotes de 500 usuarios
    const BATCH_SIZE = 500;
    const results = await processBatch(usersData, BATCH_SIZE, processUser);

    const endTime = Date.now();
    const timeElapsed = (endTime - startTime) / 1000;

    // Preparar resumen detallado
    const summary = {
      success: true,
      totalProcessed: usersData.length,
      updatedCount: results.success.length,
      errorCount: results.errors.length,
      timeElapsedSeconds: timeElapsed,
      ratePerSecond: (usersData.length / timeElapsed).toFixed(2),
      errors: results.errors.map(e => ({
        email: e.item.email,
        error: e.error
      })),
      message: `Sincronización completada - Total: ${usersData.length}, Actualizados: ${results.success.length}, Errores: ${results.errors.length}, Tiempo: ${timeElapsed.toFixed(2)}s`
    };

    // Guardar log detallado en Firestore
    await admin.firestore().collection('syncLogs').add({
      ...summary,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return summary;
  } catch (error) {
    console.error('Error en la sincronización de usuarios:', error);
    return {
      success: false,
      error: error.message,
      updatedCount: 0,
      errorCount: 0,
    };
  }
};