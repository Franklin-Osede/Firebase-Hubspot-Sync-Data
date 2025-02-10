require('dotenv').config();
const admin = require('firebase-admin');
const excelUtils = require('../utils/excelUtils');

// Function to initialize Firebase
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

// Function to obtain the last position synchronize
async function getLastSyncPosition() {
  const db = admin.firestore();
  const syncStateDoc = await db.collection('syncState').doc('lastPosition').get();
  if (!syncStateDoc.exists) {
    await db.collection('syncState').doc('lastPosition').set({ position: 0 });
    return 0;
  }
  return syncStateDoc.data().position;
}

// Function to update the position position on syncronization
async function updateSyncPosition(position) {
  const db = admin.firestore();
  await db.collection('syncState').doc('lastPosition').set({
    position,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  });
}

// Original function to sincronize all the users
exports.syncUsersFromExcel = async () => {
  try {
    // Reads all the data from the excel
    const usersData = await excelUtils.readExcel();

    // Get the reference of user´s colection on Firestore
    const usersRef = admin.firestore().collection('users');

    let updatedCount = 0;
    let errorCount = 0;
    let errorEmails = [];

    for (const user of usersData) {
      if (!user.email || !user.hubspotId) {
        console.warn(`Registro incompleto: ${JSON.stringify(user)}`);
        errorCount++;
        errorEmails.push({
          email: user.email || 'No email',
          error: 'Registro incompleto'
        });
        continue;
      }

      // Find the user in Firestore by email
      const snapshot = await usersRef.where('email', '==', user.email.toLowerCase()).get();

      if (!snapshot.empty) {
        // Update the document with the hubspotId and the synchronization timestamp.
        await snapshot.docs[0].ref.update({
          hubspotId: user.hubspotId,
          lastSyncedWithHubspot: new Date().toISOString(),
        });
        updatedCount++;
      } else {
        console.log(`Usuario no encontrado en Firestore: ${user.email}`);
        errorCount++;
        errorEmails.push({
          email: user.email,
          error: 'Usuario no encontrado en Firestore'
        });
      }
    }

    return {
      success: true,
      updatedCount,
      errorCount,
      errorEmails,
      message: `Sincronización completada - Actualizados: ${updatedCount}, Errores: ${errorCount}`,
    };
  } catch (error) {
    console.error('Error en la sincronización de usuarios:', error);
    return {
      success: false,
      error: error.message,
      updatedCount: 0,
      errorCount: 0
    };
  }
};

//  New function to synchronize in batches.
exports.syncNextBatch = async () => {
  try {
    console.log('Iniciando sincronización del siguiente lote...');
    const startTime = Date.now();

    // Read all users from the Excel.
    const allUsers = await excelUtils.readExcel();
    console.log(`Total de usuarios en Excel: ${allUsers.length}`);

    // Read all users from the Excel file.
    const lastPosition = await getLastSyncPosition();
    console.log(`Última posición sincronizada: ${lastPosition}`);

    // Check if the synchronization has already been completed.
    if (lastPosition >= allUsers.length) {
      console.log('Sincronización ya completada. No hay más usuarios para procesar.');
      return {
        success: true,
        message: 'Sincronización ya completada anteriormente.',
        position: allUsers.length,
        status: 'COMPLETED'
      };
    }

    // Calculate the next batch of 50 users.
    const batchSize = 50;
    const endPosition = Math.min(lastPosition + batchSize, allUsers.length);
    const usersBatch = allUsers.slice(lastPosition, endPosition);

    if (usersBatch.length === 0) {
      console.log('Sincronización completada. No hay más usuarios para procesar.');
      return {
        success: true,
        message: 'Sincronización completada. Proceso finalizado.',
        position: allUsers.length,
        status: 'COMPLETED'
      };
    }

    //Get reference to the users collection
    const usersRef = admin.firestore().collection('users');
    let updatedCount = 0;
    let errorCount = 0;
    let errorEmails = [];

    // Process the current batch.
    for (const user of usersBatch) {
      try {
        if (!user.email || !user.hubspotId) {
          console.warn(`Registro incompleto: ${JSON.stringify(user)}`);
          errorCount++;
          errorEmails.push({
            email: user.email || 'No email',
            error: 'Registro incompleto'
          });
          continue;
        }

        const snapshot = await usersRef.where('email', '==', user.email.toLowerCase()).get();

        if (!snapshot.empty) {
          await snapshot.docs[0].ref.update({
            hubspotId: user.hubspotId,
            lastSyncedWithHubspot: new Date().toISOString(),
          });
          updatedCount++;
          console.log(`Usuario actualizado: ${user.email}`);
        } else {
          console.log(`Usuario no encontrado en Firestore: ${user.email}`);
          errorCount++;
          errorEmails.push({
            email: user.email,
            error: 'Usuario no encontrado en Firestore'
          });
        }
      } catch (error) {
        console.error(`Error procesando usuario ${user.email}:`, error);
        errorCount++;
        errorEmails.push({
          email: user.email,
          error: error.message
        });
      }
    }

    // Update the position for the next batch.
    await updateSyncPosition(endPosition);

    const endTime = Date.now();
    const timeElapsed = (endTime - startTime) / 1000;

    const result = {
      success: true,
      batchProcessed: usersBatch.length,
      totalUsers: allUsers.length,
      currentPosition: endPosition,
      updatedCount,
      errorCount,
      errorEmails,
      timeElapsedSeconds: timeElapsed,
      status: endPosition >= allUsers.length ? 'COMPLETED' : 'IN_PROGRESS',
      message: `Lote sincronizado - Procesados: ${usersBatch.length}, Actualizados: ${updatedCount}, Errores: ${errorCount}, Posición actual: ${endPosition}/${allUsers.length}`
    };

    // Save log en Firestore
    await admin.firestore().collection('syncLogs').add({
      ...result,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return result;
  } catch (error) {
    console.error('Error en la sincronización:', error);
    return {
      success: false,
      error: error.message,
      updatedCount: 0,
      errorCount: 0,
      status: 'ERROR'
    };
  }
};