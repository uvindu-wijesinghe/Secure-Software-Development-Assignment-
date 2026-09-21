const userModel = require('../models/userModel');

async function adminOnly(req, res, next) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: 'Authentication required',
        error: true,
        success: false
      });
    }

    const user = await userModel.findById(req.userId).select('role');
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({
        message: 'Administrator access required',
        error: true,
        success: false
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      message: 'Authorization check failed',
      error: true,
      success: false
    });
  }
}

module.exports = adminOnly;
