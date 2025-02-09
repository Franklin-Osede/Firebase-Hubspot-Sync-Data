const syncUsersService = require('../services/syncUsersService');

exports.syncUsers = async (context) => {
  try {
    const result = await syncUsersService.syncUsersFromExcel();
    console.log(result.message);
  } catch (error) {
    console.error('Error en la sincronización de usuarios:', error);
  }
};
