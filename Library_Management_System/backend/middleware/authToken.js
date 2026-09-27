const jwt = require('jsonwebtoken');

async function authToken(req, res, next) {
  try {
    let token = null;

    // 1. Authorization: Bearer <token>
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }
    // 2. httpOnly cookie (preferred for browser clients)
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }
    // NOTE: Query-string tokens (?token=) are intentionally NOT accepted
    // to prevent leakage via logs, Referer headers, and browser history.

    if (!token) {
      return res.status(401).json({
        message: 'Authentication required. Please login to access this resource.',
        error: true,
        success: false,
        code: 'NO_TOKEN'
      });
    }

    jwt.verify(token, process.env.TOKEN_SECRET_KEY, function (err, decoded) {
      if (err) {
        if (req.cookies?.token) {
          res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
          });
        }

        let errorMessage = 'Invalid or expired token';
        let errorCode = 'INVALID_TOKEN';

        if (err.name === 'TokenExpiredError') {
          errorMessage = 'Session expired. Please login again.';
          errorCode = 'TOKEN_EXPIRED';
        } else if (err.name === 'JsonWebTokenError') {
          errorMessage = 'Invalid authentication token.';
          errorCode = 'MALFORMED_TOKEN';
        }

        return res.status(401).json({
          message: errorMessage,
          error: true,
          success: false,
          code: errorCode
        });
      }

      req.userId = decoded?._id;
      req.userEmail = decoded?.email;
      req.user = decoded;
      next();
    });
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(500).json({
      message: 'Internal authentication server error',
      error: true,
      success: false,
      code: 'AUTH_SERVER_ERROR'
    });
  }
}

module.exports = authToken;
