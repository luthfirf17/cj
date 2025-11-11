const { query } = require('../../config/database');
const bcrypt = require('bcryptjs');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Total users (excluding admin)
    const totalUsersResult = await query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'user'"
    );
    
    // Active users
    const activeUsersResult = await query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'user' AND is_active = true"
    );
    
    // Inactive users
    const inactiveUsersResult = await query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'user' AND is_active = false"
    );
    
    // New users this month
    const newUsersResult = await query(
      `SELECT COUNT(*) as count FROM users 
       WHERE role = 'user' 
       AND created_at >= date_trunc('month', CURRENT_DATE)`
    );
    
    // Total bookings across all users
    const totalBookingsResult = await query(
      'SELECT COUNT(*) as count FROM bookings'
    );
    
    // Total revenue across all users
    const totalRevenueResult = await query(
      'SELECT COALESCE(SUM(total_price), 0) as total FROM bookings'
    );
    
    // Total expenses across all users
    const totalExpensesResult = await query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses'
    );
    
    // Recent users (last 10)
    const recentUsersResult = await query(
      `SELECT id, full_name, email, phone, created_at, last_login, is_active 
       FROM users 
       WHERE role = 'user' 
       ORDER BY created_at DESC 
       LIMIT 10`
    );
    
    // Users with most bookings (top 5)
    const topUsersResult = await query(
      `SELECT u.id, u.full_name, u.email, 
              COUNT(b.id) as booking_count,
              COUNT(DISTINCT c.id) as client_count,
              COALESCE(SUM(b.total_price), 0) as total_revenue
       FROM users u
       LEFT JOIN bookings b ON u.id = b.user_id
       LEFT JOIN clients c ON u.id = c.user_id
       WHERE u.role = 'user'
       GROUP BY u.id, u.full_name, u.email
       ORDER BY total_revenue DESC
       LIMIT 5`
    );
    
    res.json({
      stats: {
        totalUsers: parseInt(totalUsersResult.rows[0].count),
        activeUsers: parseInt(activeUsersResult.rows[0].count),
        inactiveUsers: parseInt(inactiveUsersResult.rows[0].count),
        newUsersThisMonth: parseInt(newUsersResult.rows[0].count),
        totalBookings: parseInt(totalBookingsResult.rows[0].count),
        totalRevenue: parseFloat(totalRevenueResult.rows[0].total),
        totalExpenses: parseFloat(totalExpensesResult.rows[0].total)
      },
      recentUsers: recentUsersResult.rows,
      topUsers: topUsersResult.rows
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
};

// Get all users with pagination and filters
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = "WHERE role = 'user'";
    const params = [];
    let paramIndex = 1;
    
    if (search) {
      whereClause += ` AND (full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (status !== 'all') {
      whereClause += ` AND is_active = $${paramIndex}`;
      params.push(status === 'active');
      paramIndex++;
    }
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM users ${whereClause}`,
      params
    );
    
    // Get users
    const usersResult = await query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.created_at, u.updated_at, 
              u.last_login, u.is_active,
              COUNT(DISTINCT b.id) as booking_count,
              COUNT(DISTINCT c.id) as client_count,
              COALESCE(SUM(b.total_price), 0) as total_revenue
       FROM users u
       LEFT JOIN bookings b ON u.id = b.user_id
       LEFT JOIN clients c ON u.id = c.user_id
       ${whereClause}
       GROUP BY u.id, u.full_name, u.email, u.phone, u.created_at, u.updated_at, u.last_login, u.is_active
       ORDER BY u.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );
    
    res.json({
      users: usersResult.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// Get single user details
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const userResult = await query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.created_at, u.updated_at, 
              u.last_login, u.is_active,
              COUNT(DISTINCT b.id) as booking_count,
              COUNT(DISTINCT c.id) as client_count,
              COUNT(DISTINCT s.id) as service_count,
              COUNT(DISTINCT e.id) as expense_count,
              COALESCE(SUM(b.total_price), 0) as total_revenue,
              COALESCE(SUM(e.amount), 0) as total_expenses
       FROM users u
       LEFT JOIN bookings b ON u.id = b.user_id
       LEFT JOIN clients c ON u.id = c.user_id
       LEFT JOIN services s ON u.id = s.user_id
       LEFT JOIN expenses e ON u.id = e.user_id
       WHERE u.id = $1 AND u.role = 'user'
       GROUP BY u.id`,
      [id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(userResult.rows[0]);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Failed to fetch user details' });
  }
};

// Update user status (activate/deactivate)
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    const result = await query(
      'UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 AND role = $3 RETURNING id, full_name, email, is_active',
      [is_active, id, 'user']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists and is not admin
    const userCheck = await query(
      'SELECT id, role FROM users WHERE id = $1',
      [id]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (userCheck.rows[0].role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin user' });
    }
    
    // Delete user (cascade will handle related records)
    await query('DELETE FROM users WHERE id = $1', [id]);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// Get admin profile
const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    const result = await query(
      'SELECT id, full_name, email, phone, created_at, updated_at FROM users WHERE id = $1 AND role = $2',
      [adminId, 'admin']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    res.json({ admin: result.rows[0] });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ message: 'Failed to fetch admin profile' });
  }
};

// Update admin profile
const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { full_name, email, phone } = req.body;
    
    // Check if email is already used by another user
    if (email) {
      const emailCheck = await query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, adminId]
      );
      
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    const result = await query(
      'UPDATE users SET full_name = $1, email = $2, phone = $3, updated_at = NOW() WHERE id = $4 AND role = $5 RETURNING id, full_name, email, phone, updated_at',
      [full_name, email, phone, adminId, 'admin']
    );
    
    res.json({
      message: 'Profile updated successfully',
      admin: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

// Update admin password
const updateAdminPassword = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    // Get current password hash
    const userResult = await query(
      'SELECT password FROM users WHERE id = $1',
      [adminId]
    );
    
    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password);
    if (!isValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, adminId]
    );
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating admin password:', error);
    res.status(500).json({ message: 'Failed to update password' });
  }
};

// Update admin PIN
const updateAdminPin = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { currentPin, newPin } = req.body;
    
    // Validate PIN format (6 digits)
    if (!/^\d{6}$/.test(newPin)) {
      return res.status(400).json({ message: 'PIN must be 6 digits' });
    }
    
    // Get current PIN
    const userResult = await query(
      'SELECT security_pin FROM users WHERE id = $1',
      [adminId]
    );
    
    // Verify current PIN
    if (userResult.rows[0].security_pin !== currentPin) {
      return res.status(400).json({ message: 'Current PIN is incorrect' });
    }
    
    // Update PIN
    await query(
      'UPDATE users SET security_pin = $1, updated_at = NOW() WHERE id = $2',
      [newPin, adminId]
    );
    
    res.json({ message: 'PIN updated successfully' });
  } catch (error) {
    console.error('Error updating admin PIN:', error);
    res.status(500).json({ message: 'Failed to update PIN' });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  getAdminProfile,
  updateAdminProfile,
  updateAdminPassword,
  updateAdminPin
};
