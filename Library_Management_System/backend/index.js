const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const connectDB = require('./config/db');
const router = require('./routes');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts. Please try again later.',
    error: true,
    success: false
  }
});

app.use('/api/signin', authLimiter);
app.use('/api/signup', authLimiter);

const changePassword = require('./controller/changePassword');
const authToken = require('./middleware/authToken');

app.put('/api/change-password', authToken, changePassword);
app.use('/api', router);

const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Serve uploads as attachments to reduce drive-by execution risk
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('Content-Disposition', 'attachment');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  },
  express.static(uploadsPath)
);

app.get('/api/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);

  if (req.params.filename.includes('..')) {
    return res.status(400).json({ success: false, message: 'Invalid filename' });
  }

  if (fs.existsSync(filePath)) {
    res.download(filePath, req.query.name || path.basename(filePath), (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Error downloading file' });
        }
      }
    });
  } else {
    res.status(404).json({ success: false, message: 'File not found' });
  }
});

// Multer / upload errors
app.use((err, req, res, next) => {
  if (err instanceof require('multer').MulterError) {
    return res.status(400).json({
      message: err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 5MB)' : err.message,
      error: true,
      success: false
    });
  }
  if (err && err.message && err.message.includes('Only JPEG')) {
    return res.status(400).json({
      message: err.message,
      error: true,
      success: false
    });
  }
  if (err && err.message && (err.message.includes('Only image') || err.message.includes('Only PDF'))) {
    return res.status(400).json({
      message: err.message,
      error: true,
      success: false
    });
  }
  next(err);
});

const PORT = process.env.PORT || 8000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log('Connected to DB');
    console.log('Server is running on port', PORT);
  });
});
