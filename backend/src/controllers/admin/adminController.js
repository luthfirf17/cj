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
      `SELECT id, full_name, email, phone, created_at, is_active 
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
              u.is_active,
              COUNT(DISTINCT b.id) as booking_count,
              COUNT(DISTINCT c.id) as client_count,
              COALESCE(SUM(b.total_price), 0) as total_revenue
       FROM users u
       LEFT JOIN bookings b ON u.id = b.user_id
       LEFT JOIN clients c ON u.id = c.user_id
       ${whereClause}
       GROUP BY u.id, u.full_name, u.email, u.phone, u.created_at, u.updated_at, u.is_active
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
              u.is_active,
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

// Backup and Restore Functions

// Export full system backup (all users and their data)
const exportFullBackup = async (req, res) => {
  try {
    const backup = {
      metadata: {
        version: '1.0',
        exported_at: new Date().toISOString(),
        exported_by: 'admin',
        type: 'full_system_backup'
      },
      data: {}
    };

    // Export all users
    const usersResult = await query(`
      SELECT id, username, full_name, email, phone, role, security_pin, 
             is_active, created_at, updated_at
      FROM users 
      ORDER BY id
    `);
    backup.data.users = usersResult.rows;

    // Export all clients
    const clientsResult = await query(`
      SELECT id, user_id, name, phone, email, address, company, notes, 
             created_at, updated_at
      FROM clients 
      ORDER BY id
    `);
    backup.data.clients = clientsResult.rows;

    // Export all services
    const servicesResult = await query(`
      SELECT id, user_id, name, description, price, duration, category, 
             is_active, created_at, updated_at
      FROM services 
      ORDER BY id
    `);
    backup.data.services = servicesResult.rows;

    // Export all bookings
    const bookingsResult = await query(`
      SELECT id, user_id, client_id, service_id, booking_date, booking_time,
             location_name, location_map_url, status, total_price, notes,
             created_at, updated_at
      FROM bookings 
      ORDER BY id
    `);
    backup.data.bookings = bookingsResult.rows;

    // Export all payments
    const paymentsResult = await query(`
      SELECT id, booking_id, amount, payment_method, payment_status, 
             payment_date, notes, created_at, updated_at
      FROM payments 
      ORDER BY id
    `);
    backup.data.payments = paymentsResult.rows;

    // Export all expenses
    const expensesResult = await query(`
      SELECT e.id, e.user_id, e.amount, e.description, e.expense_date, 
             e.category_id, ec.name as category_name, e.created_at, e.updated_at
      FROM expenses e
      LEFT JOIN expense_categories ec ON e.category_id = ec.id
      ORDER BY e.id
    `);
    backup.data.expenses = expensesResult.rows;

    // Export expense categories
    const expenseCategoriesResult = await query(`
      SELECT id, user_id, name, color, icon, is_default, created_at, updated_at
      FROM expense_categories 
      ORDER BY id
    `);
    backup.data.expenseCategories = expenseCategoriesResult.rows;

    // Export company settings
    const companySettingsResult = await query(`
      SELECT id, user_id, company_name, company_address, company_phone, company_email,
             bank_name, account_number, account_holder_name, company_logo_url,
             created_at, updated_at
      FROM company_settings 
      ORDER BY id
    `);
    backup.data.companySettings = companySettingsResult.rows;

    // Export responsible parties
    const responsiblePartiesResult = await query(`
      SELECT id, user_id, name, phone, address, created_at, updated_at
      FROM responsible_parties
      ORDER BY id
    `);
    backup.data.responsibleParties = responsiblePartiesResult.rows;

    // Export service responsible parties
    const serviceResponsiblePartiesResult = await query(`
      SELECT id, service_id, responsible_party_id, created_at, updated_at
      FROM service_responsible_parties 
      ORDER BY id
    `);
    backup.data.serviceResponsibleParties = serviceResponsiblePartiesResult.rows;

    // Set response headers
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=full_system_backup_${new Date().toISOString().split('T')[0]}.json`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json(backup);
  } catch (error) {
    console.error('Error exporting full backup:', error);
    res.status(500).json({ message: 'Failed to export full backup' });
  }
};

// Import full system backup
const importFullBackup = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No backup file uploaded' });
    }

    // Validate file
    if (req.file.mimetype !== 'application/json' && !req.file.originalname.endsWith('.json')) {
      return res.status(400).json({ message: 'File must be JSON format' });
    }

    // Parse backup data
    let backupData;
    try {
      const fileContent = req.file.buffer.toString();
      backupData = JSON.parse(fileContent);
    } catch (parseError) {
      return res.status(400).json({ message: 'Invalid JSON file format' });
    }

    // Validate backup format
    if (!backupData.data || !backupData.metadata) {
      return res.status(400).json({ message: 'Invalid backup file format' });
    }

    // Begin transaction
    await query('BEGIN');

    try {
      // Clear existing data (in reverse dependency order)
      await query('DELETE FROM service_responsible_parties');
      await query('DELETE FROM responsible_parties');
      await query('DELETE FROM payments');
      await query('DELETE FROM bookings');
      await query('DELETE FROM expenses');
      await query('DELETE FROM expense_categories');
      await query('DELETE FROM clients');
      await query('DELETE FROM services');
      await query('DELETE FROM company_settings');
      // Keep users data intact for safety

      // Import data (in dependency order)
      
      // Import users (skip if already exists)
      if (backupData.data.users && backupData.data.users.length > 0) {
        for (const user of backupData.data.users) {
          // Check if user exists
          const existingUser = await query('SELECT id FROM users WHERE id = $1', [user.id]);
          if (existingUser.rows.length === 0) {
            await query(`
              INSERT INTO users (id, username, full_name, email, phone, role, security_pin, is_active, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [user.id, user.username, user.full_name, user.email, user.phone, user.role, user.security_pin, user.is_active, user.created_at, user.updated_at]);
          }
        }
      }

      // Import clients
      if (backupData.data.clients && backupData.data.clients.length > 0) {
        for (const client of backupData.data.clients) {
          await query(`
            INSERT INTO clients (id, user_id, name, phone, email, address, company, notes, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [client.id, client.user_id, client.name, client.phone, client.email, client.address, client.company, client.notes, client.created_at, client.updated_at]);
        }
      }

      // Import services
      if (backupData.data.services && backupData.data.services.length > 0) {
        for (const service of backupData.data.services) {
          await query(`
            INSERT INTO services (id, user_id, name, description, price, duration, category, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [service.id, service.user_id, service.name, service.description, service.price, service.duration, service.category, service.is_active, service.created_at, service.updated_at]);
        }
      }

      // Import bookings
      if (backupData.data.bookings && backupData.data.bookings.length > 0) {
        for (const booking of backupData.data.bookings) {
          await query(`
            INSERT INTO bookings (id, user_id, client_id, service_id, booking_date, booking_time, location_name, location_map_url, status, total_price, notes, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `, [booking.id, booking.user_id, booking.client_id, booking.service_id, booking.booking_date, booking.booking_time, booking.location_name, booking.location_map_url, booking.status, booking.total_price, booking.notes, booking.created_at, booking.updated_at]);
        }
      }

      // Import payments
      if (backupData.data.payments && backupData.data.payments.length > 0) {
        for (const payment of backupData.data.payments) {
          await query(`
            INSERT INTO payments (id, booking_id, amount, payment_method, payment_status, payment_date, notes, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [payment.id, payment.booking_id, payment.amount, payment.payment_method, payment.payment_status, payment.payment_date, payment.notes, payment.created_at, payment.updated_at]);
        }
      }

      // Import expense categories
      if (backupData.data.expenseCategories && backupData.data.expenseCategories.length > 0) {
        for (const category of backupData.data.expenseCategories) {
          await query(`
            INSERT INTO expense_categories (id, user_id, name, color, icon, is_default, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [category.id, category.user_id, category.name, category.color, category.icon, category.is_default, category.created_at, category.updated_at]);
        }
      }

      // Import expenses
      if (backupData.data.expenses && backupData.data.expenses.length > 0) {
        for (const expense of backupData.data.expenses) {
          await query(`
            INSERT INTO expenses (id, user_id, amount, description, expense_date, category_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [expense.id, expense.user_id, expense.amount, expense.description, expense.expense_date, expense.category_id, expense.created_at, expense.updated_at]);
        }
      }

      // Import company settings
      if (backupData.data.companySettings && backupData.data.companySettings.length > 0) {
        for (const setting of backupData.data.companySettings) {
          await query(`
            INSERT INTO company_settings (id, user_id, company_name, company_address, company_phone, company_email, bank_name, account_number, account_holder_name, company_logo_url, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `, [setting.id, setting.user_id, setting.company_name, setting.company_address, setting.company_phone, setting.company_email, setting.bank_name, setting.account_number, setting.account_holder_name, setting.company_logo_url, setting.created_at, setting.updated_at]);
        }
      }

      // Import responsible parties
      if (backupData.data.responsibleParties && backupData.data.responsibleParties.length > 0) {
        for (const party of backupData.data.responsibleParties) {
          await query(`
            INSERT INTO responsible_parties (id, user_id, name, phone, address, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [party.id, party.user_id, party.name, party.phone, party.address, party.created_at, party.updated_at]);
        }
      }

      // Import service responsible parties
      if (backupData.data.serviceResponsibleParties && backupData.data.serviceResponsibleParties.length > 0) {
        for (const srp of backupData.data.serviceResponsibleParties) {
          await query(`
            INSERT INTO service_responsible_parties (id, service_id, responsible_party_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5)
          `, [srp.id, srp.service_id, srp.responsible_party_id, srp.created_at, srp.updated_at]);
        }
      }

      // Commit transaction
      await query('COMMIT');

      res.json({ 
        message: 'Full system backup imported successfully',
        imported: {
          users: backupData.data.users?.length || 0,
          clients: backupData.data.clients?.length || 0,
          services: backupData.data.services?.length || 0,
          bookings: backupData.data.bookings?.length || 0,
          payments: backupData.data.payments?.length || 0,
          expenses: backupData.data.expenses?.length || 0,
          expenseCategories: backupData.data.expenseCategories?.length || 0,
          companySettings: backupData.data.companySettings?.length || 0,
          responsibleParties: backupData.data.responsibleParties?.length || 0,
          serviceResponsibleParties: backupData.data.serviceResponsibleParties?.length || 0
        }
      });
    } catch (importError) {
      await query('ROLLBACK');
      throw importError;
    }
  } catch (error) {
    console.error('Error importing full backup:', error);
    res.status(500).json({ message: 'Failed to import full backup' });
  }
};

// Get backup history/status
const getBackupStatus = async (req, res) => {
  try {
    // Get database statistics
    const stats = {
      tables: {},
      lastBackup: null,
      databaseSize: null
    };

    // Count records in each table
    const tables = ['users', 'clients', 'services', 'bookings', 'payments', 'expenses', 'expense_categories', 'company_settings', 'responsible_parties', 'service_responsible_parties'];
    
    for (const table of tables) {
      const result = await query(`SELECT COUNT(*) as count FROM ${table}`);
      stats.tables[table] = result.rows[0].count;
    }

    // Get database size
    const dbSizeResult = await query(`SELECT pg_database_size(current_database()) as size_bytes`);
    const sizeBytes = parseInt(dbSizeResult.rows[0].size_bytes);
    
    // Convert to appropriate unit
    let sizeValue, sizeUnit;
    if (sizeBytes < 1024 * 1024) { // Less than 1MB
      sizeValue = (sizeBytes / 1024).toFixed(2);
      sizeUnit = 'KB';
    } else if (sizeBytes < 1024 * 1024 * 1024) { // Less than 1GB
      sizeValue = (sizeBytes / (1024 * 1024)).toFixed(2);
      sizeUnit = 'MB';
    } else { // 1GB or more
      sizeValue = (sizeBytes / (1024 * 1024 * 1024)).toFixed(2);
      sizeUnit = 'GB';
    }
    
    // Calculate usage percentage (max 40GB)
    const maxStorageBytes = 40 * 1024 * 1024 * 1024; // 40GB in bytes
    const usagePercentage = (sizeBytes / maxStorageBytes) * 100;
    
    stats.databaseSize = {
      bytes: sizeBytes,
      value: parseFloat(sizeValue),
      unit: sizeUnit,
      formatted: `${sizeValue} ${sizeUnit}`,
      usagePercentage: Math.min(usagePercentage, 100), // Cap at 100%
      maxStorage: '40 GB'
    };

    // Get last modified timestamp
    const lastModifiedResult = await query(`
      SELECT GREATEST(
        (SELECT MAX(updated_at) FROM users),
        (SELECT MAX(updated_at) FROM clients),
        (SELECT MAX(updated_at) FROM services),
        (SELECT MAX(updated_at) FROM bookings),
        (SELECT MAX(updated_at) FROM payments),
        (SELECT MAX(updated_at) FROM expenses)
      ) as last_modified
    `);
    
    stats.lastModified = lastModifiedResult.rows[0].last_modified;

    res.json(stats);
  } catch (error) {
    console.error('Error getting backup status:', error);
    res.status(500).json({ message: 'Failed to get backup status' });
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
  updateAdminPin,
  exportFullBackup,
  importFullBackup,
  getBackupStatus
};
