const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

function issueAppSession(res, user) {
  const tokenData = {
    _id: user._id,
    email: user.email,
    name: user.name,
    role: user.role
  };

  const token = jwt.sign(tokenData, process.env.TOKEN_SECRET_KEY, {
    expiresIn: '24h'
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  });

  return token;
}

function googleAuthStart(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const callbackUrl =
    process.env.GOOGLE_CALLBACK_URL ||
    `http://localhost:${process.env.PORT || 8000}/api/auth/google/callback`;

  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/login?oauth=error&reason=not_configured`);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account'
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}

async function googleAuthCallback(req, res) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl =
    process.env.GOOGLE_CALLBACK_URL ||
    `http://localhost:${process.env.PORT || 8000}/api/auth/google/callback`;

  try {
    const { code, error } = req.query;

    if (error) {
      return res.redirect(
        `${frontendUrl}/login?oauth=error&reason=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      return res.redirect(`${frontendUrl}/login?oauth=error&reason=missing_code`);
    }

    if (!clientId || !clientSecret) {
      return res.redirect(`${frontendUrl}/login?oauth=error&reason=not_configured`);
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code'
      })
    });

    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson.access_token) {
      console.error('Google token exchange failed');
      return res.redirect(`${frontendUrl}/login?oauth=error&reason=token_exchange`);
    }

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` }
    });
    const profile = await profileRes.json();

    if (!profileRes.ok || !profile.email) {
      return res.redirect(`${frontendUrl}/login?oauth=error&reason=profile`);
    }

    let user = await userModel.findOne({
      $or: [{ googleId: profile.sub }, { email: profile.email }]
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = profile.sub;
        if (!user.authProvider || user.authProvider === 'local') {
          user.authProvider = user.password ? 'local' : 'google';
        }
        if (!user.profilePic && profile.picture) {
          user.profilePic = profile.picture;
        }
        await user.save();
      }
    } else {
      user = new userModel({
        name: profile.name || profile.email.split('@')[0],
        email: profile.email,
        googleId: profile.sub,
        authProvider: 'google',
        profilePic: profile.picture || '',
        role: 'GENERAL',
        membershipStatus: 'PENDING',
        fines: 0,
        reservationLimit: 2
      });
      await user.save();
    }

    issueAppSession(res, user);
    return res.redirect(`${frontendUrl}/?oauth=success`);
  } catch (err) {
    console.error('Google OAuth callback error:', err.message);
    return res.redirect(`${frontendUrl}/login?oauth=error&reason=server`);
  }
}

module.exports = {
  googleAuthStart,
  googleAuthCallback
};
