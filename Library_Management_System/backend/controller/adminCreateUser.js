const userModel = require('../models/userModel');

/**
 * Admin-only user creation — may set role to ADMIN or GENERAL.
 */
async function adminCreateUser(req, res) {
  try {
    const { email, password, name, role = 'GENERAL', profilePic } = req.body;

    if (!email) throw new Error('Please provide email');
    if (!password) throw new Error('Please provide password');
    if (!name) throw new Error('Please provide name');
    if (password.length < 6) throw new Error('Password must be at least 6 characters');

    const allowedRoles = ['ADMIN', 'GENERAL'];
    const safeRole = allowedRoles.includes(role) ? role : 'GENERAL';

    const existingUser = await userModel.findOne({ email });
    if (existingUser) throw new Error('User already exists with this email');

    const userData = new userModel({
      email,
      name,
      password,
      role: safeRole,
      authProvider: 'local',
      ...(profilePic && { profilePic }),
      membershipStatus: safeRole === 'ADMIN' ? 'ACTIVE' : 'PENDING',
      fines: 0,
      reservationLimit: 2
    });

    const saveUser = await userData.save();

    res.status(201).json({
      message: 'User Created Successfully!',
      data: {
        _id: saveUser._id,
        name: saveUser.name,
        email: saveUser.email,
        role: saveUser.role,
        registrationNumber: saveUser.registrationNumber
      },
      success: true,
      error: false
    });
  } catch (err) {
    console.error('Admin create user error:', err.message);
    res.status(400).json({
      message: err.message || 'Error creating user',
      error: true,
      success: false
    });
  }
}

module.exports = adminCreateUser;
