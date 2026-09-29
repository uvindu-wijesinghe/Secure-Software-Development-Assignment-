const userModel = require('../models/userModel');

/**
 * Admin-only update (route must use authToken + adminOnly).
 * Role changes are restricted to ADMIN/GENERAL enum values.
 */
async function updateUser(req, res) {
  try {
    const { userId, email, name, role, profilePic, contactNumber, address } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: 'userId is required',
        error: true,
        success: false
      });
    }

    const payload = {
      ...(email && { email }),
      ...(name && { name }),
      ...(profilePic && { profilePic }),
      ...(contactNumber !== undefined && { contactNumber }),
      ...(address !== undefined && { address })
    };

    if (role !== undefined) {
      const allowedRoles = ['ADMIN', 'GENERAL'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          message: 'Invalid role',
          error: true,
          success: false
        });
      }
      payload.role = role;
    }

    const updated = await userModel
      .findByIdAndUpdate(userId, payload, { new: true })
      .select('-password');

    if (!updated) {
      return res.status(404).json({
        message: 'User not found',
        error: true,
        success: false
      });
    }

    res.json({
      data: updated,
      message: 'User Updated',
      success: true,
      error: false
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false
    });
  }
}

module.exports = updateUser;
