# 📝 Example: Securing Existing Endpoints

## Contoh Migrasi dari Endpoint Lama ke Secure Endpoint

### ❌ BEFORE (Tidak Aman)

```javascript
// backend/src/server.js

// Endpoint lama - VULNERABLE!
app.get('/api/user/bookings', async (req, res) => {
  try {
    // ❌ user_id dari query parameter - bisa dimanipulasi!
    const userId = req.query.user_id || 2;
    
    const result = await query(
      'SELECT * FROM bookings WHERE user_id = $1',
      [userId]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error' });
  }
});
```

**Masalah:**
1. ❌ Tidak ada authentication - siapa saja bisa akses
2. ❌ user_id dari query parameter - bisa diubah di URL
3. ❌ User A bisa lihat data User B dengan mengubah `?user_id=`
4. ❌ Tidak ada authorization check
5. ❌ Tidak ada multi-tenancy enforcement

### ✅ AFTER (Aman & Profesional)

```javascript
// backend/src/server.js
const { authenticate, enforceTenancy } = require('./middlewares/authMiddleware');

// Endpoint baru - SECURE!
app.get('/api/user/bookings', 
  authenticate,        // 1️⃣ Verify JWT token
  enforceTenancy,     // 2️⃣ Enforce data isolation
  async (req, res) => {
    try {
      // ✅ user_id dari JWT token - tidak bisa dimanipulasi!
      const userId = req.user.id;
      
      const result = await query(
        'SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Get bookings error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan saat mengambil data booking' 
      });
    }
  }
);
```

**Keuntungan:**
1. ✅ Authentication: Hanya user yang login bisa akses
2. ✅ JWT Verification: Token valid & belum expire
3. ✅ Multi-Tenancy: User hanya bisa lihat data sendiri
4. ✅ Secure: user_id dari token, tidak bisa diubah
5. ✅ Professional error handling

---

## Contoh Update Semua Endpoint User

### Pattern yang Aman

```javascript
const { authenticate, enforceTenancy, authorize } = require('./middlewares/authMiddleware');

// ============================================
// USER ENDPOINTS (Protected & Tenant-Isolated)
// ============================================

// 1. Dashboard Stats
app.get('/api/user/dashboard/stats', 
  authenticate, 
  enforceTenancy, 
  async (req, res) => {
    const userId = req.user.id;
    // Query stats for this user only
  }
);

// 2. Get Bookings
app.get('/api/user/bookings', 
  authenticate, 
  enforceTenancy, 
  async (req, res) => {
    const userId = req.user.id;
    // Query bookings for this user only
  }
);

// 3. Create Booking
app.post('/api/user/bookings', 
  authenticate, 
  enforceTenancy, 
  async (req, res) => {
    const userId = req.user.id;
    const { client_name, service_type, booking_date } = req.body;
    
    // Insert with user_id from token
    await query(
      'INSERT INTO bookings (user_id, client_name, service_type, booking_date) VALUES ($1, $2, $3, $4)',
      [userId, client_name, service_type, booking_date]
    );
  }
);

// 4. Update Booking
app.put('/api/user/bookings/:id', 
  authenticate, 
  enforceTenancy, 
  async (req, res) => {
    const userId = req.user.id;
    const bookingId = req.params.id;
    
    // ✅ IMPORTANT: Verify booking belongs to user before update
    const checkOwnership = await query(
      'SELECT id FROM bookings WHERE id = $1 AND user_id = $2',
      [bookingId, userId]
    );
    
    if (checkOwnership.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke booking ini'
      });
    }
    
    // Update booking
    await query(
      'UPDATE bookings SET ... WHERE id = $1 AND user_id = $2',
      [..., bookingId, userId]
    );
  }
);

// 5. Delete Booking
app.delete('/api/user/bookings/:id', 
  authenticate, 
  enforceTenancy, 
  async (req, res) => {
    const userId = req.user.id;
    const bookingId = req.params.id;
    
    // ✅ Verify ownership before delete
    await query(
      'DELETE FROM bookings WHERE id = $1 AND user_id = $2',
      [bookingId, userId]
    );
  }
);

// ============================================
// ADMIN ENDPOINTS (Admin Only)
// ============================================

app.get('/api/admin/users', 
  authenticate, 
  authorize('admin'), 
  async (req, res) => {
    // Admin can see all users
    const users = await query('SELECT * FROM users');
    res.json({ success: true, data: users.rows });
  }
);
```

---

## Frontend Update Example

### ❌ BEFORE (Tidak Aman)

```javascript
// frontend/src/pages/User/UserDashboard.jsx

const fetchStats = async () => {
  // ❌ user_id hardcoded atau dari localStorage
  const response = await fetch('http://localhost:5001/api/user/dashboard/stats?user_id=2');
  const data = await response.json();
  setStats(data);
};
```

### ✅ AFTER (Aman)

```javascript
// frontend/src/pages/User/UserDashboard.jsx
import api from '../../services/api';

const fetchStats = async () => {
  try {
    // ✅ Token automatically attached by interceptor
    // ✅ No need to pass user_id
    const response = await api.get('/user/dashboard/stats');
    
    if (response.data.success) {
      setStats(response.data.data);
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
    // Error handled by interceptor (auto logout on 401)
  }
};
```

---

## Migration Checklist

Untuk setiap endpoint user yang ada:

### Backend
- [ ] Import middleware: `authenticate`, `enforceTenancy`
- [ ] Apply middleware to route
- [ ] Remove `user_id` from query parameters
- [ ] Use `req.user.id` from JWT token
- [ ] Verify ownership for UPDATE/DELETE operations
- [ ] Add proper error handling
- [ ] Test with real JWT token

### Frontend
- [ ] Remove manual `user_id` parameter
- [ ] Use `api` service (auto token attachment)
- [ ] Remove `localStorage.getItem('user_id')`
- [ ] Handle errors properly
- [ ] Test protected flow

---

## Testing Migrated Endpoints

### 1. Test Without Token (Should Fail)
```bash
curl http://localhost:5001/api/user/bookings
# Expected: 401 Unauthorized
```

### 2. Test With Valid Token (Should Work)
```bash
# Login first to get token
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.data.token')

# Use token to access protected endpoint
curl http://localhost:5001/api/user/bookings \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 OK with user's bookings only
```

### 3. Test Multi-Tenancy (Should Only See Own Data)
```bash
# User A logs in and gets their bookings
curl http://localhost:5001/api/user/bookings \
  -H "Authorization: Bearer $TOKEN_USER_A"
# Should only see User A's bookings

# User B logs in and gets their bookings
curl http://localhost:5001/api/user/bookings \
  -H "Authorization: Bearer $TOKEN_USER_B"
# Should only see User B's bookings (different data)
```

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Still Using Query Parameter
```javascript
// WRONG!
app.get('/api/user/bookings', authenticate, async (req, res) => {
  const userId = req.query.user_id; // ❌ Still vulnerable!
});
```

### ✅ Correct:
```javascript
app.get('/api/user/bookings', authenticate, enforceTenancy, async (req, res) => {
  const userId = req.user.id; // ✅ From JWT token
});
```

---

### ❌ Mistake 2: Not Checking Ownership on UPDATE/DELETE
```javascript
// WRONG!
app.delete('/api/user/bookings/:id', authenticate, async (req, res) => {
  const bookingId = req.params.id;
  // ❌ Any authenticated user can delete any booking!
  await query('DELETE FROM bookings WHERE id = $1', [bookingId]);
});
```

### ✅ Correct:
```javascript
app.delete('/api/user/bookings/:id', authenticate, async (req, res) => {
  const userId = req.user.id;
  const bookingId = req.params.id;
  
  // ✅ Only delete if booking belongs to user
  await query(
    'DELETE FROM bookings WHERE id = $1 AND user_id = $2',
    [bookingId, userId]
  );
});
```

---

### ❌ Mistake 3: Frontend Still Sending user_id
```javascript
// WRONG!
const response = await api.get('/user/bookings?user_id=2'); // ❌
```

### ✅ Correct:
```javascript
const response = await api.get('/user/bookings'); // ✅ Token auto-attached
```

---

## Summary

### Key Points:
1. ✅ Always use `authenticate` middleware
2. ✅ Always use `enforceTenancy` for user data
3. ✅ Get `userId` from `req.user.id` NOT from query params
4. ✅ Verify ownership on UPDATE/DELETE
5. ✅ Frontend should NOT send `user_id` manually
6. ✅ Token auto-attached by axios interceptor

### Migration Steps:
1. Add middleware to route
2. Change `req.query.user_id` to `req.user.id`
3. Add ownership verification for updates
4. Remove `user_id` from frontend calls
5. Test thoroughly

---

**Happy Securing! 🔐**
