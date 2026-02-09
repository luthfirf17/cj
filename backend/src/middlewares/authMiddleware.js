const jwt = require('jsonwebtoken');

// JWT Secret - In production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'catat-jasamu-secret-key-2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT Token
 */
const generateToken = (user, rememberMe = false) => {
  const expiresIn = rememberMe ? '30d' : (process.env.JWT_EXPIRES_IN || '7d');
  
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.id // For multi-tenancy: each user is their own tenant
    },
    JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Verify JWT Token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Authentication Middleware
 * Verifies that user is logged in
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again.'
      });
    }

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      tenant_id: decoded.tenant_id
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Authorization Middleware
 * Checks if user has required role
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

/**
 * Multi-Tenancy Middleware
 * Ensures user can only access their own data
 */
const enforceTenancy = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Add tenant_id to query parameters for filtering
  req.tenant_id = req.user.tenant_id;
  
  next();
};

/**
 * Optional Authentication
 * Allows access but adds user info if authenticated
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      if (decoded) {
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          tenant_id: decoded.tenant_id
        };
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};

/**
 * Admin Only Middleware
 * Ensures only admin users can access
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  next();
};

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  authorize,
  enforceTenancy,
  optionalAuth,
  isAdmin,
  JWT_SECRET
};
