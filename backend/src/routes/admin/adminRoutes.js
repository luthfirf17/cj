const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, isAdmin } = require('../../middlewares/authMiddleware');
const {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  getAdminProfile,
  updateAdminProfile,
  updateAdminPassword,
  updateAdminPin,
  exportFullBackup,
  importFullBackup,
  getBackupStatus
} = require('../../controllers/admin/adminController');

// Configure multer for backup file upload
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'));
    }
  }
});

// All routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// User Management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Admin Profile
router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);
router.put('/password', updateAdminPassword);
router.put('/pin', updateAdminPin);

// Backup and Restore
router.get('/backup/status', getBackupStatus);
router.get('/backup/export', exportFullBackup);
router.post('/backup/import', upload.single('backupFile'), importFullBackup);

module.exports = router;
