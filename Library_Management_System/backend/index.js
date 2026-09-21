const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser');
require('dotenv').config();
const connectDB = require('./config/db')
const router = require('./routes');
const path = require('path');
const app = express()
const fs = require('fs');

// Increase payload size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}))

// Debug middleware
app.use((req, res, next) => {
    if (req.method === 'PUT' && req.url === '/api/change-password') {
        console.log('=== INCOMING CHANGE PASSWORD REQUEST ===');
        console.log('Headers:', {
            'content-type': req.headers['content-type'],
            'cookie': req.headers['cookie'] ? 'Present' : 'Missing'
        });
        console.log('Body:', req.body);
    }
    next();
});

app.use(cookieParser())

// Import controllers and middleware
const changePassword = require('./controller/changePassword');
const authToken = require('./middleware/authToken');

// Add change password route
app.put('/api/change-password', authToken, changePassword);

// Your existing routes
app.use("/api", router)

const uploadsPath = path.join(__dirname, 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

// Add proper headers for file downloads
app.use('/uploads', (req, res, next) => {
    res.setHeader('Content-Disposition', 'attachment');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
}, express.static(uploadsPath));

app.use((err, req, res, next) => {
    if (err instanceof require('multer').MulterError) {
        return res.status(400).json({
            message: err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 5MB)' : err.message,
            error: true,
            success: false
        });
    }
    if (err && err.message && (err.message.includes('Only JPEG') || err.message.includes('Only image') || err.message.includes('Only PDF'))) {
        return res.status(400).json({ message: err.message, error: true, success: false });
    }
    next(err);
});

app.use('/api/download', express.static(path.join(__dirname, 'uploads')), (req, res, next) => {
    res.setHeader('Content-Disposition', 'attachment');
    next();
});

app.get('/api/download/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath, req.query.name || path.basename(filePath), (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(500).json({ success: false, message: 'Error downloading file' });
            }
        });
    } else {
        res.status(404).json({ success: false, message: 'File not found' });
    }
});

const PORT = process.env.PORT || 8000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("Connected to DB")
        console.log("Server is running on port", PORT)
    })
})