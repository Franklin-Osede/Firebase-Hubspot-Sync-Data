const excelUtils = require('../utils/excelUtils');
const admin = require('firebase-admin');

exports.syncUsersFromExcel = async () => {
  try {
    // Leer y procesar el archivo Excel
    const usersData = await excelUtils.readExcel();

    // Obtener la referencia a la colección de usuarios en Firestore
    const usersRef = admin.firestore().collection('users');

    // Contadores para seguimiento
    let updatedCount = 0;
    let errorCount = 0;

    // Procesar cada usuario
    for (const user of usersData) {
      try {
        const { email, hubspotId } = user;

        // Buscar el documento del usuario por email
        const snapshot = await usersRef.where('email', '==', email.toLowerCase()).get();

        if (!snapshot.empty) {
          // Actualizar el documento con el hubspotId
          await snapshot.docs[0].ref.update({
            hubspotId,
            lastSyncedWithHubspot: new Date().toISOString(),
          });

          updatedCount++;
        } else {
          console.log(`Usuario no encontrado en Firestore: ${email}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`Error procesando email ${user.email}:`, error);
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
