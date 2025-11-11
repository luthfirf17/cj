# 🔐 Authentication, Authorization & Multi-Tenancy System

## Overview

Sistem ini mengimplementasikan **3 layer keamanan profesional**:

1. **Authentication (Autentikasi)** - Memverifikasi siapa Anda
2. **Authorization (Otorisasi)** - Memverifikasi apa yang boleh Anda lakukan
3. **Multi-Tenancy** - Memastikan Anda hanya melihat/mengelola data milik Anda sendiri

---

## 🏗️ Arsitektur Sistem

### Backend Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Client Request                      │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │   Authentication Middleware   │
            │  (Verify JWT Token)           │
            └───────────────┬───────────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │   Authorization Middleware    │
            │  (Check User Role)            │
            └───────────────┬───────────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │   Multi-Tenancy Middleware    │
            │  (Enforce Data Isolation)     │
            └───────────────┬───────────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │        Route Handler          │
            │   (Process Request)           │
            └───────────────────────────────┘
```

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Action                          │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │   Auth Service Layer          │
            │  (Manage Token & User Data)   │
            └───────────────┬───────────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │   Axios Interceptor           │
            │  (Attach JWT to Headers)      │
            └───────────────┬───────────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │   API Request to Backend      │
            └───────────────┬───────────────┘
                            │
                            ▼
            ┌───────────────────────────────┐
            │   Response Handler            │
            │  (Update UI / Handle Errors)  │
            └───────────────────────────────┘
```

---

## 🔑 1. Authentication (Autentikasi)

### Backend Implementation

**File:** `backend/src/middlewares/authMiddleware.js`

```javascript
const authenticate = async (req, res, next) => {
  // 1. Get token from Authorization header
  const token = req.headers.authorization?.split(' ')[1];
  
  // 2. Verify JWT token
  const decoded = jwt.verify(token, JWT_SECRET);
  
  // 3. Attach user info to request
  req.user = decoded;
  
  next();
};
```

**File:** `backend/src/controllers/authController.js`

- `register()` - Registrasi user baru dengan bcrypt password hashing
- `login()` - Verifikasi credentials dan generate JWT token
- `getProfile()` - Get user profile (protected)
- `updateProfile()` - Update user data (protected)
- `changePassword()` - Ganti password (protected)
- `verifyToken()` - Verify JWT validity (protected)

### Frontend Implementation

**File:** `frontend/src/services/authService.js`

```javascript
const authService = {
  login: async (credentials) => {
    // Call API
    const response = await api.post('/auth/login', credentials);
    
    // Save token & user data
    localStorage.setItem('auth_token', response.data.token);
    localStorage.setItem('user_data', JSON.stringify(response.data.user));
    
    return response.data;
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  }
};
```

**File:** `frontend/src/services/api.js`

```javascript
// Request Interceptor - Auto attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor - Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### JWT Token Structure

```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "user",
  "tenant_id": 1,
  "iat": 1635724800,
  "exp": 1636329600
}
```

---

## 👮 2. Authorization (Otorisasi)

### Role-Based Access Control (RBAC)

**Roles:**
- `admin` - Full access to all features
- `user` - Access to their own data only

### Backend Implementation

**File:** `backend/src/middlewares/authMiddleware.js`

```javascript
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission'
      });
    }
    next();
  };
};
```

**Usage Example:**

```javascript
// Only admin can access
app.get('/api/admin/users', 
  authenticate, 
  authorize('admin'), 
  getUsersHandler
);

// Both admin and user can access
app.get('/api/bookings', 
  authenticate, 
  authorize('admin', 'user'), 
  getBookingsHandler
);
```

### Frontend Implementation

**File:** `frontend/src/components/Auth/RoleBasedRoute.jsx`

```javascript
const RoleBasedRoute = ({ allowedRoles }) => {
  const user = authService.getUser();
  
  if (!allowedRoles.includes(user.role)) {
    // Redirect based on role
    return user.role === 'admin' 
      ? <Navigate to="/admin/dashboard" /> 
      : <Navigate to="/user/dashboard" />;
  }
  
  return <Outlet />;
};
```

**Usage in Routes:**

```javascript
// Admin only routes
<Route element={<RoleBasedRoute allowedRoles={['admin']} />}>
  <Route path="/admin/dashboard" element={<AdminDashboard />} />
</Route>

// User only routes
<Route element={<RoleBasedRoute allowedRoles={['user']} />}>
  <Route path="/user/dashboard" element={<UserDashboard />} />
</Route>
```

---

## 🏢 3. Multi-Tenancy (Data Isolation)

### Concept

Setiap user adalah **tenant** yang terpisah. User hanya bisa melihat dan mengelola data milik mereka sendiri.

### Backend Implementation

**File:** `backend/src/middlewares/authMiddleware.js`

```javascript
const enforceTenancy = (req, res, next) => {
  // Attach tenant_id from authenticated user
  req.tenant_id = req.user.tenant_id; // or req.user.id
  next();
};
```

**Usage in Controllers:**

```javascript
// ❌ WRONG - Not secure, anyone can access any user's data
app.get('/api/bookings', async (req, res) => {
  const userId = req.query.user_id; // Vulnerable!
  const bookings = await query('SELECT * FROM bookings WHERE user_id = $1', [userId]);
});

// ✅ CORRECT - Enforced multi-tenancy
app.get('/api/bookings', authenticate, enforceTenancy, async (req, res) => {
  const userId = req.user.id; // From JWT token, cannot be tampered
  const bookings = await query('SELECT * FROM bookings WHERE user_id = $1', [userId]);
});
```

### Database Design

**Key Principle:** Setiap tabel harus memiliki kolom `user_id` untuk data isolation.

```sql
-- Bookings table
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  -- ... other columns
);

-- Expenses table
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  -- ... other columns
);

-- Always filter by user_id in queries
SELECT * FROM bookings WHERE user_id = $1;
SELECT * FROM expenses WHERE user_id = $1;
```

---

## 📋 API Endpoints

### Authentication Endpoints (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |

### Protected Endpoints (Requires Authentication)

| Method | Endpoint | Description | Auth | Tenancy |
|--------|----------|-------------|------|---------|
| GET | `/api/auth/profile` | Get profile | ✅ | ✅ |
| PUT | `/api/auth/profile` | Update profile | ✅ | ✅ |
| POST | `/api/auth/change-password` | Change password | ✅ | ✅ |
| GET | `/api/auth/verify` | Verify token | ✅ | ✅ |
| GET | `/api/user/dashboard/stats` | Get stats | ✅ | ✅ |
| GET | `/api/user/bookings` | Get bookings | ✅ | ✅ |
| GET | `/api/user/expenses` | Get expenses | ✅ | ✅ |

---

## 🔒 Security Best Practices

### Backend Security

1. **Password Hashing**
   ```javascript
   const bcrypt = require('bcrypt');
   const hashedPassword = await bcrypt.hash(password, 10);
   ```

2. **JWT Secret**
   - Use strong, random secret (min 32 characters)
   - Store in environment variable
   - Never commit to version control
   ```bash
   JWT_SECRET=your-super-secret-key-min-32-chars-long
   ```

3. **Token Expiration**
   ```javascript
   jwt.sign(payload, secret, { expiresIn: '7d' });
   ```

4. **Input Validation**
   ```javascript
   if (!email || !password) {
     return res.status(400).json({ message: 'Missing required fields' });
   }
   ```

5. **SQL Injection Protection**
   ```javascript
   // ❌ VULNERABLE
   query(`SELECT * FROM users WHERE email = '${email}'`);
   
   // ✅ SAFE - Use parameterized queries
   query('SELECT * FROM users WHERE email = $1', [email]);
   ```

### Frontend Security

1. **Secure Token Storage**
   ```javascript
   // Store in localStorage (for web apps)
   localStorage.setItem('auth_token', token);
   
   // For mobile apps, use secure storage like:
   // - React Native: react-native-keychain
   // - Ionic: @ionic-native/secure-storage
   ```

2. **Auto Logout on Token Expiry**
   ```javascript
   api.interceptors.response.use(
     (response) => response,
     (error) => {
       if (error.response?.status === 401) {
         authService.logout();
       }
       return Promise.reject(error);
     }
   );
   ```

3. **Protected Routes**
   ```javascript
   <Route element={<ProtectedRoute />}>
     <Route path="/dashboard" element={<Dashboard />} />
   </Route>
   ```

4. **XSS Protection**
   ```javascript
   // React automatically escapes values
   <div>{userInput}</div> // Safe
   
   // Avoid dangerouslySetInnerHTML unless necessary
   <div dangerouslySetInnerHTML={{__html: userInput}} /> // Unsafe!
   ```

---

## 🧪 Testing

### Test Login Flow

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Register New User:**
   ```bash
   curl -X POST http://localhost:5001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "full_name": "Test User",
       "email": "test@example.com",
       "password": "password123"
     }'
   ```

4. **Login:**
   ```bash
   curl -X POST http://localhost:5001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123"
     }'
   ```

5. **Access Protected Endpoint:**
   ```bash
   curl http://localhost:5001/api/auth/profile \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

---

## 📊 Data Flow Diagram

### Login Flow

```
User (Browser)
    │
    │ 1. Enter email & password
    ▼
Login Component
    │
    │ 2. authService.login()
    ▼
API Service
    │
    │ 3. POST /api/auth/login
    ▼
Backend Server
    │
    │ 4. Verify credentials
    │ 5. Generate JWT token
    ▼
Database
    │
    │ 6. Return user + token
    ▼
Frontend
    │
    │ 7. Save token & user to localStorage
    │ 8. Redirect to dashboard
    ▼
User Dashboard (Protected)
```

### Protected Request Flow

```
User Dashboard
    │
    │ 1. Fetch data
    ▼
API Service
    │
    │ 2. GET /api/user/bookings
    │ 3. Attach JWT token in header
    ▼
Backend Middleware
    │
    │ 4. authenticate() - Verify JWT
    │ 5. enforceTenancy() - Get user_id from token
    ▼
Route Handler
    │
    │ 6. Query database with user_id
    ▼
Database
    │
    │ 7. Return ONLY user's data
    ▼
Frontend
    │
    │ 8. Display data
    ▼
User Dashboard
```

---

## 🚀 Production Deployment

### Environment Variables

**Backend (.env):**
```bash
NODE_ENV=production
JWT_SECRET=<GENERATE_STRONG_RANDOM_SECRET_64_CHARS>
JWT_EXPIRES_IN=7d
DB_HOST=<production_db_host>
DB_PASSWORD=<strong_db_password>
FRONTEND_URL=https://yourdomain.com
```

**Frontend (.env.production):**
```bash
VITE_API_URL=https://api.yourdomain.com/api
```

### Security Checklist

- [ ] Change JWT_SECRET to strong random value
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Set secure HTTP headers (helmet.js)
- [ ] Enable rate limiting
- [ ] Implement refresh tokens
- [ ] Add 2FA (Two-Factor Authentication)
- [ ] Implement account lockout after failed attempts
- [ ] Add CAPTCHA for login/register
- [ ] Enable CORS only for your domain
- [ ] Regularly update dependencies
- [ ] Implement logging & monitoring
- [ ] Add database encryption at rest
- [ ] Regular security audits

---

## 📚 Resources

- [JWT.io](https://jwt.io/) - JWT documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Web security risks
- [bcrypt](https://www.npmjs.com/package/bcrypt) - Password hashing
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) - JWT library

---

## 💡 Tips

1. **Never expose sensitive data in JWT payload** - JWT is encoded, not encrypted!
2. **Always use HTTPS in production** - Prevent token interception
3. **Implement token refresh mechanism** - For better UX
4. **Log all authentication attempts** - For security monitoring
5. **Implement rate limiting** - Prevent brute force attacks

---

**Created with 🔒 Security & ❤️ Professionalism**
