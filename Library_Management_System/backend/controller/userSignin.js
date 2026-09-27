const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');

async function userSignInController(req, res) {
  try {
    const { email, password } = req.body;

    if (!email) throw new Error('Please provide email');
    if (!password) throw new Error('Please provide password');

    const user = await userModel.findOne({ email });

    // Generic message to avoid user enumeration
    if (!user || !user.password) {
      return res.status(401).json({
        message: 'Invalid email or password',
        error: true,
        success: false
      });
    }

    const checkPassword = await bcrypt.compare(password, user.password);

    if (!checkPassword) {
      return res.status(401).json({
        message: 'Invalid email or password',
        error: true,
        success: false
      });
    }

    const tokenData = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    const token = jwt.sign(tokenData, process.env.TOKEN_SECRET_KEY, {
      expiresIn: '24h'
    });

    const tokenOption = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000
    };

    // JWT is delivered via httpOnly cookie only (not in JSON body)
    res.cookie('token', token, tokenOption).json({
      message: 'Login Successful',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePic: user.profilePic,
          registrationNumber: user.registrationNumber
        }
      },
      success: true,
      error: false
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(400).json({
      message: err.message || 'An unexpected error occurred',
      error: true,
      success: false
    });
  }
}

module.exports = userSignInController;
