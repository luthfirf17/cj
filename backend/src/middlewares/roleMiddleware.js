/**
 * Middleware to check user role
 * Usage: router.get('/admin-only', authMiddleware, checkRole(['admin']), controller)
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // User data should be attached by authMiddleware
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Unauthorized - No user data'
        })
      }

      const userRole = req.user.role

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden - Insufficient permissions'
        })
      }

      next()
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Server error'
      })
    }
  }
}

// Shorthand middlewares
const isAdmin = checkRole(['admin'])
const isUser = checkRole(['user'])
const isAdminOrUser = checkRole(['admin', 'user'])

module.exports = {
  checkRole,
  isAdmin,
  isUser,
  isAdminOrUser
}
