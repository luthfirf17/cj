const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { generateToken } = require('../middlewares/authMiddleware');

/**
 * Register new user
 */
const register = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { full_name, email, password, phone } = req.body;

    // Validation
    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nama lengkap, email, dan password wajib diisi'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password minimal 6 karakter'
      });
    }

    // Check if email already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate username from email (part before @)
    const username = email.split('@')[0].toLowerCase();

    // Insert new user
    const result = await client.query(
      `INSERT INTO users (username, full_name, email, password, phone, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, username, full_name, email, phone, role, created_at`,
      [username, full_name, email.toLowerCase(), hashedPassword, phone || null, 'user']
    );

    const user = result.rows[0];

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          created_at: user.created_at,
          is_new_user: true // Flag to indicate this is a newly registered user
        },
        token
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat registrasi'
    });
  } finally {
    client.release();
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { email, password, remember_me } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi'
      });
    }

    // Find user by email
    const result = await client.query(
      `SELECT id, full_name, email, password, phone, role, auth_provider, avatar_url, booking_code, created_at
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // Generate token
    const token = generateToken(user, remember_me === true);

    // Update last login
    await client.query(
      'UPDATE users SET updated_at = NOW() WHERE id = $1',
      [user.id]
    );

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          auth_provider: user.auth_provider || 'local',
          avatar_url: user.avatar_url,
          booking_code: user.booking_code,
          created_at: user.created_at
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat login'
    });
  } finally {
    client.release();
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;

    const result = await client.query(
      `SELECT id, full_name, full_name AS name, email, phone, role, 
              auth_provider, avatar_url, google_email, booking_code,
              created_at, updated_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil profil'
    });
  } finally {
    client.release();
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const { full_name, phone } = req.body;

    const result = await client.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, full_name, email, phone, role, created_at, updated_at`,
      [full_name, phone, userId]
    );

    res.json({
      success: true,
      message: 'Profil berhasil diupdate',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat update profil'
    });
  } finally {
    client.release();
  }
};

/**
 * Change password
 */
const changePassword = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const { old_password, new_password } = req.body;

    // Validation
    if (!old_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Password lama dan baru wajib diisi'
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password baru minimal 6 karakter'
      });
    }

    // Get current password
    const result = await client.query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(old_password, result.rows[0].password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Password lama salah'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // Update password
    await client.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: 'Password berhasil diubah'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengubah password'
    });
  } finally {
    client.release();
  }
};

/**
 * Verify token and get user
 */
const verifyToken = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat verifikasi token'
    });
  }
};

/**
 * Verify email and PIN for forgot password
 */
const verifyEmailAndPin = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { email, pin } = req.body;

    // Validation
    if (!email || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Email dan PIN wajib diisi'
      });
    }

    if (pin.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'PIN harus 6 digit'
      });
    }

    // Find user by email
    const result = await client.query(
      'SELECT id, email, security_pin FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Email tidak ditemukan'
      });
    }

    const user = result.rows[0];

    // Check if user has PIN
    if (!user.security_pin) {
      return res.status(400).json({
        success: false,
        message: 'Anda belum mengatur PIN keamanan'
      });
    }

    // Verify PIN
    const isPinValid = await bcrypt.compare(pin, user.security_pin);

    if (!isPinValid) {
      return res.status(400).json({
        success: false,
        message: 'PIN salah'
      });
    }

    res.json({
      success: true,
      message: 'Email dan PIN berhasil diverifikasi'
    });

  } catch (error) {
    console.error('Verify email and PIN error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat verifikasi'
    });
  } finally {
    client.release();
  }
};

/**
 * Reset password with email and PIN (without login)
 */
const resetPasswordWithEmailPin = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { email, newPassword } = req.body;

    // Validation
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password baru wajib diisi'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password baru minimal 6 karakter'
      });
    }

    // Find user by email
    const result = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Email tidak ditemukan'
      });
    }

    const user = result.rows[0];

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await client.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, user.id]
    );

    res.json({
      success: true,
      message: 'Password berhasil direset'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mereset password'
    });
  } finally {
    client.release();
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  verifyToken,
  verifyEmailAndPin,
  resetPasswordWithEmailPin
};
