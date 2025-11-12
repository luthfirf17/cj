const { generateToken } = require('./src/middlewares/authMiddleware');

const testUser = {
  id: 7,
  email: 'admin@cataljasamu.com',
  role: 'admin'
};

try {
  const token = generateToken(testUser);
  console.log('Token generated successfully');
  console.log('Token length:', token.length);
  console.log('Token starts with:', token.substring(0, 20) + '...');
} catch (err) {
  console.error('Error generating token:', err);
}