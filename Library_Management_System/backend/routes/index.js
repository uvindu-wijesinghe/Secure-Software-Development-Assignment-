const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const upload = require('../middleware/uploadMiddleware');

const userSignUpController = require('../controller/userSignup');
const userSignInController = require('../controller/userSignin');
const userDetailsController = require('../controller/userDetails');
const authToken = require('../middleware/authToken');
const adminOnly = require('../middleware/adminOnly');
const userLogout = require('../controller/userLogout');
const allUsers = require('../controller/allUsers');
const updateUser = require('../controller/updateUser');
const deleteUser = require('../controller/deleteUser');
const checkIndexNumber = require('../controller/checkIndexNumberController');
const adminCreateUser = require('../controller/adminCreateUser');
const { googleAuthStart, googleAuthCallback } = require('../controller/authGoogle');

const {
  getBooks,
  addBook,
  updateBook,
  deleteBook,
  getBookById
} = require('../controller/bookController');
const {
  createReservation,
  getUserReservations,
  getAllReservations,
  updateReservationStatus,
  cancelReservation
} = require('../controller/bookReservationController');
const changePassword = require('../controller/changePassword');

const {
  getEBooks,
  getEBookById,
  addEBook,
  updateEBook,
  deleteEBook,
  viewEBook
} = require('../controller/eBookController');
const ebookUpload = require('../middleware/ebookUpload');

const {
  uploadMembershipSlip,
  approveMembership,
  getAllPendingMemberships
} = require('../controller/membershipController');

// ---------- OAuth / OpenID Connect (Google) ----------
router.get('/auth/google', googleAuthStart);
router.get('/auth/google/callback', googleAuthCallback);

// ---------- E-Books ----------
router.get('/e-books', getEBooks);
router.get('/e-books/:id', getEBookById);
router.post(
  '/e-books',
  authToken,
  adminOnly,
  ebookUpload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'pdf', maxCount: 1 }
  ]),
  addEBook
);
router.put(
  '/e-books/:id',
  authToken,
  adminOnly,
  ebookUpload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'pdf', maxCount: 1 }
  ]),
  updateEBook
);
router.delete('/e-books/:id', authToken, adminOnly, deleteEBook);
router.get('/e-books/view/:id', getEBookById);
router.get('/e-books/view-pdf/:id', viewEBook);

// ---------- Books ----------
router.get('/books', getBooks);
router.get('/books/:id', getBookById);
router.post('/books', authToken, adminOnly, upload.single('image'), addBook);
router.put('/books/:id', authToken, adminOnly, upload.single('image'), updateBook);
router.delete('/books/:id', authToken, adminOnly, deleteBook);

// ---------- Reservations ----------
router.post('/book-reservation', authToken, createReservation);
router.get('/user-reservations', authToken, getUserReservations);
router.get('/all-reservations', authToken, adminOnly, getAllReservations);
router.put('/reservation-status/:id', authToken, adminOnly, updateReservationStatus);
router.put('/cancel-reservation/:id', authToken, cancelReservation);
router.put('/change-password', authToken, changePassword);

// ---------- Membership ----------
router.post(
  '/upload-membership-slip',
  authToken,
  upload.single('slipImage'),
  uploadMembershipSlip
);
router.post('/approve-membership', authToken, adminOnly, approveMembership);
router.get('/pending-memberships', authToken, adminOnly, getAllPendingMemberships);

// ---------- Auth / users ----------
router.post('/signup', userSignUpController);
router.post('/signin', userSignInController);
router.get('/user-details', authToken, userDetailsController);
router.get('/userLogout', userLogout);

// Admin panel routes
router.get('/all-users', authToken, adminOnly, allUsers);
router.post('/update-user', authToken, adminOnly, updateUser);
router.delete('/delete-user/:id', authToken, adminOnly, deleteUser);
router.post('/admin/create-user', authToken, adminOnly, adminCreateUser);
router.get('/check-index-number', checkIndexNumber);

// File download
router.get('/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    if (!filename || filename.includes('..')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename'
      });
    }

    const uploadsDir = path.join(__dirname, '../uploads');
    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const originalName = req.query.name || filename;
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(originalName)}"`
    );

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming file'
        });
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
