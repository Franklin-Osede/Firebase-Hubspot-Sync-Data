const functions = require('firebase-functions');
const syncUsersService = require('./services/syncUsersService');

exports.syncUsers = functions.https.onRequest(async (req, res) => {
  try {
    const result = await syncUsersService.syncUsersFromExcel();
    console.log(result.message);

    res.status(200).json({
      success: result.success,
      message: result.message,
      updatedCount: result.updatedCount,
      errorCount: result.errorCount,
    });
  } catch (error) {
    console.error('Error en la sincronización de usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la sincronización de usuarios',
      error: error.message,
    });
  }
});
