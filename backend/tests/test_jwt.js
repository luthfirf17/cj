const jwt = require('jsonwebtoken');

const JWT_SECRET = 'catat-jasamu-secret-key-2025';

const testUser = {
  id: 2,
  email: 'john@example.com',
  role: 'user',
  tenant_id: 2
};

try {
  const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '7d' });
  console.log('Token:', token);

  // Verify token
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('Decoded:', decoded);
} catch (err) {
  console.error('Error:', err);
}