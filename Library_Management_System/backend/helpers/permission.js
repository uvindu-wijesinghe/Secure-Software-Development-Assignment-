const userModel = require('../models/userModel');

/**
 * Returns true if the given userId belongs to an ADMIN.
 */
async function isAdmin(userId) {
  if (!userId) return false;
  const user = await userModel.findById(userId).select('role');
  return Boolean(user && user.role === 'ADMIN');
}

module.exports = isAdmin;
