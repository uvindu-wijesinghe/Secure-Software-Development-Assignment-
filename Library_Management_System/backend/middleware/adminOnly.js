const userModel = require('../models/userModel');

/**
 * Requires authToken to run first (sets req.userId).
 * Allows only users with role === 'ADMIN'.
 */
async function adminOnly(req, res, next) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: 'Authentication required',
        error: true,
        success: false,
        code: 'NO_TOKEN'
      });
    }

    const user = await userModel.findById(req.userId).select('role email');
    if (!user) {
      return res.status(401).json({
        message: 'User not found',
        error: true,
        success: false,
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        message: 'Admin access required',
        error: true,
        success: false,
        code: 'FORBIDDEN'
      });
    }

    req.userRole = user.role;
    req.adminUser = user;
    next();
  } catch (err) {
    console.error('adminOnly middleware error:', err.message);
    return res.status(500).json({
      message: 'Authorization check failed',
      error: true,
      success: false,
      code: 'AUTHZ_ERROR'
    });
  }
}

module.exports = adminOnly;
