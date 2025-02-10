const excelUtils = require('../utils/excelUtils');
const admin = require('firebase-admin');

exports.syncUsersFromExcel = async () => {
  try {
    const usersData = await excelUtils.readExcel();
    const usersRef = admin.firestore().collection('users');

    let updatedCount = 0;
    let errorCount = 0;

    for (const user of usersData) {
      if (!user.email || !user.hubspotId) {
        console.warn(`Registro incompleto: ${JSON.stringify(user)}`);
        errorCount++;
        continue;
      }

      const snapshot = await usersRef.where('email', '==', user.email.toLowerCase()).get();

      if (!snapshot.empty) {
        await snapshot.docs[0].ref.update({
          hubspotId: user.hubspotId,
          lastSyncedWithHubspot: new Date().toISOString(),
        });
        updatedCount++;
      } else {
        console.log(`Usuario no encontrado en Firestore: ${user.email}`);
        errorCount++;
      }
    }

    return {
      success: true,
      updatedCount,
      errorCount,
      message: `Sincronización completada - Actualizados: ${updatedCount}, Errores: ${errorCount}`,
    };
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