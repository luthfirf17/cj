const express = require('express');
const router = express.Router();
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
  updateAdminPin
} = require('../../controllers/admin/adminController');

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

module.exports = router;
