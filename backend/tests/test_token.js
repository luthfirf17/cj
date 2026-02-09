const { generateToken } = require('../backend/src/middlewares/authMiddleware');

const testUser = {
  id: 2,
  email: 'john@example.com',
  role: 'user'
};

try {
  const token = generateToken(testUser);
  console.log('Token generated successfully');
  console.log('Token length:', token.length);
  console.log('Token starts with:', token.substring(0, 20) + '...');
} catch (err) {
  console.error('Error generating token:', err);
}