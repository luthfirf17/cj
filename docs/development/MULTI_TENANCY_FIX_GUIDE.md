# 🔐 Multi-Tenancy Fix Guide
## Membuat Setiap User Punya Data Sendiri

---

## 📋 Yang Sudah Berhasil

✅ **Backend Authentication System**
- JWT authentication sudah ter-implement
- Register & Login berhasil
- Token disimpan di localStorage
- 2 user berhasil dibuat (lihat terminal log)

✅ **Middleware Siap**
- `authenticate` - verify JWT token
- `enforceTenancy` - enforce user_id from token
- `authorize` - role-based access

---

## ❌ Masalah yang Harus Diperbaiki

### Problem 1: Frontend Masih Kirim `user_id=2`

**File yang masih hardcode user_id:**
- `frontend/src/pages/User/UserDashboard.jsx`
- `frontend/src/pages/User/FinancialPage.jsx`
- `frontend/src/pages/User/BookingPage.jsx`
- `frontend/src/components/**/*.jsx`

**Contoh Code yang SALAH:**
```javascript
// ❌ WRONG - masih hardcode user_id
const response = await fetch('http://localhost:5001/api/user/dashboard/stats?user_id=2');
```

**Harus Jadi:**
```javascript
// ✅ CORRECT - use api service with auto token
import api from '../../services/api';

const response = await api.get('/user/dashboard/stats'); // No user_id!
```

---

### Problem 2: Backend Masih Terima `req.query.user_id`

**File:** `backend/src/server.js`

**Endpoint yang masih vulnerable:**

1. **GET /api/user/bookings** (Line ~127)
```javascript
// ❌ WRONG
app.get('/api/user/bookings', async (req, res) => {
  const userId = req.query.user_id || 2; // VULNERABLE!
```

**Harus:**
```javascript
// ✅ CORRECT
app.get('/api/user/bookings', authenticate, enforceTenancy, async (req, res) => {
  const userId = req.user.id; // From JWT token - SECURE!
```

2. **GET /api/user/services** (Line ~241)
3. **POST /api/user/services** (Line ~275)
4. **GET /api/user/clients** (Line ~407)
5. **POST /api/user/clients** (Line ~432)
6. **POST /api/user/bookings** (Line ~778)
7. **PUT /api/user/bookings/:id** (Line ~545)
8. **GET /api/user/company-settings** (Line ~865)
9. **POST /api/user/company-settings** (Line ~890)
10. **PUT /api/user/company-settings** (Line ~947)
11. **GET /api/user/expenses** (Line ~1019)
12. **POST /api/user/expenses** (Line ~1108)
13. **GET /api/user/financial-summary** (Line ~1353)

---

## 🛠️ Cara Memperbaiki (Step by Step)

### Step 1: Fix Backend Endpoints

**Pattern untuk semua endpoint user:**

```javascript
// BEFORE:
app.get('/api/user/ENDPOINT', async (req, res) => {
  const userId = req.query.user_id || 2; // ❌ VULNERABLE
  
  // ... query database dengan userId
});

// AFTER:
app.get('/api/user/ENDPOINT', authenticate, enforceTenancy, async (req, res) => {
  const userId = req.user.id; // ✅ SECURE - from JWT token
  
  // ... query database dengan userId
});
```

**Untuk POST/PUT/DELETE, hapus `user_id` dari req.body:**

```javascript
// BEFORE:
app.post('/api/user/ENDPOINT', async (req, res) => {
  const { user_id, ...data } = req.body; // ❌
  // INSERT VALUES (user_id, ...)
});

// AFTER:
app.post('/api/user/ENDPOINT', authenticate, enforceTenancy, async (req, res) => {
  const userId = req.user.id; // ✅ from token
  const { ...data } = req.body; // no user_id in body!
  // INSERT VALUES (userId, ...)
});
```

---

### Step 2: Fix Frontend API Calls

**Pattern untuk semua API calls:**

```javascript
// BEFORE:
// ❌ Using fetch directly dengan hardcode user_id
const response = await fetch(`http://localhost:5001/api/user/ENDPOINT?user_id=2`);

const body = {
  user_id: 2,
  name: 'Test',
  // ...
};
await fetch('http://localhost:5001/api/user/ENDPOINT', {
  method: 'POST',
  body: JSON.stringify(body)
});

// AFTER:
// ✅ Using api service - token auto-attached
import api from '../../services/api';

// GET request
const response = await api.get('/user/ENDPOINT'); // No user_id!

// POST request
const body = {
  // NO user_id here!
  name: 'Test',
  // ...
};
const response = await api.post('/user/ENDPOINT', body);
```

---

### Step 3: Replace `fetch` dengan `api` Service

**File yang perlu diupdate:**

1. **frontend/src/pages/User/UserDashboard.jsx**
   - Import: `import api from '../../services/api';`
   - Replace all `fetch()` with `api.get()` / `api.post()`
   - Remove all `?user_id=2` dari URL
   - Remove `user_id` dari request body

2. **frontend/src/pages/User/FinancialPage.jsx**
   - Same as above

3. **frontend/src/pages/User/BookingPage.jsx**
   - Same as above

4. **frontend/src/components/modals/** (semua modal components)
   - Same as above

---

## 📝 Script Otomatis untuk Fix

### Backend Fix Script

Buat file `backend/fix-multi-tenancy.js`:

```javascript
const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'src', 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

// List of endpoints to fix
const endpoints = [
  '/api/user/bookings',
  '/api/user/services',
  '/api/user/clients',
  '/api/user/expenses',
  '/api/user/company-settings',
  '/api/user/financial-summary'
];

// Replace pattern
endpoints.forEach(endpoint => {
  // Fix GET endpoints
  content = content.replace(
    new RegExp(`app\\.get\\('${endpoint}'`, 'g'),
    `app.get('${endpoint}', authenticate, enforceTenancy`
  );
  
  // Fix POST endpoints
  content = content.replace(
    new RegExp(`app\\.post\\('${endpoint}'`, 'g'),
    `app.post('${endpoint}', authenticate, enforceTenancy`
  );
  
  // Fix PUT endpoints
  content = content.replace(
    new RegExp(`app\\.put\\('${endpoint}`, 'g'),
    `app.put('${endpoint}', authenticate, enforceTenancy`
  );
});

// Replace user_id from query
content = content.replace(
  /const userId = req\.query\.user_id \|\| 2;/g,
  'const userId = req.user.id; // From JWT token - SECURE!'
);

// Replace user_id from body destructuring
content = content.replace(
  /const { user_id,/g,
  'const userId = req.user.id; // From JWT token\n    const {'
);

fs.writeFileSync(serverPath, content, 'utf8');
console.log('✅ Backend fixed!');
```

Run: `node backend/fix-multi-tenancy.js`

---

### Frontend Fix Script

Buat file `frontend/fix-api-calls.js`:

```javascript
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all JSX files
const files = glob.sync('src/**/*.{js,jsx}', { cwd: __dirname });

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already using api service
  if (content.includes("import api from")) {
    return;
  }
  
  // Check if file uses fetch with localhost:5001
  if (!content.includes('localhost:5001')) {
    return;
  }
  
  console.log(`Fixing: ${file}`);
  
  // Add import if using fetch
  if (content.includes('fetch(')) {
    // Add import at top (after other imports)
    const importMatch = content.match(/import .+ from .+;[\n\r]+/g);
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      content = content.replace(
        lastImport,
        lastImport + "import api from '../../services/api';\n"
      );
    }
  }
  
  // Replace fetch calls
  content = content.replace(
    /await fetch\('http:\/\/localhost:5001\/api\/(.+?)\?user_id=2(&[^']+)?'\)/g,
    "await api.get('/$1$2')"
  );
  
  content = content.replace(
    /await fetch\('http:\/\/localhost:5001\/api\/(.+?)'\)/g,
    "await api.get('/$1')"
  );
  
  // Replace fetch POST
  content = content.replace(
    /await fetch\('http:\/\/localhost:5001\/api\/(.+?)',\s*{[\s\S]+?method:\s*'POST',[\s\S]+?body:\s*JSON\.stringify\((.+?)\)[\s\S]+?}\)/g,
    "await api.post('/$1', $2)"
  );
  
  // Remove user_id from objects
  content = content.replace(
    /user_id:\s*['"]?2['"]?,?\s*/g,
    ''
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('✅ Frontend fixed!');
```

Run: `cd frontend && node fix-api-calls.js`

---

## 🧪 Testing Multi-Tenancy

### Test 1: Register 2 Users

```bash
# User 1
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Alice","email":"alice@test.com","password":"password123"}'

# User 2
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Bob","email":"bob@test.com","password":"password123"}'
```

### Test 2: Login & Get Token

```bash
# Login as Alice
TOKEN_ALICE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"password123"}' \
  | jq -r '.data.token')

echo "Alice Token: $TOKEN_ALICE"

# Login as Bob
TOKEN_BOB=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@test.com","password":"password123"}' \
  | jq -r '.data.token')

echo "Bob Token: $TOKEN_BOB"
```

### Test 3: Create Data for Each User

```bash
# Alice creates a service
curl -X POST http://localhost:5001/api/user/services \
  -H "Authorization: Bearer $TOKEN_ALICE" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Service","default_price":100}'

# Bob creates a service
curl -X POST http://localhost:5001/api/user/services \
  -H "Authorization: Bearer $TOKEN_BOB" \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob Service","default_price":200}'
```

### Test 4: Verify Data Isolation

```bash
# Alice gets services (should only see Alice Service)
curl http://localhost:5001/api/user/services \
  -H "Authorization: Bearer $TOKEN_ALICE"

# Bob gets services (should only see Bob Service)
curl http://localhost:5001/api/user/services \
  -H "Authorization: Bearer $TOKEN_BOB"
```

**Expected Result:** Alice hanya lihat "Alice Service", Bob hanya lihat "Bob Service"

---

## ✅ Checklist Completion

### Backend
- [ ] All GET endpoints use `authenticate, enforceTenancy`
- [ ] All POST endpoints use `authenticate, enforceTenancy`
- [ ] All PUT endpoints use `authenticate, enforceTenancy`
- [ ] All DELETE endpoints use `authenticate, enforceTenancy`
- [ ] Replace `req.query.user_id` with `req.user.id`
- [ ] Replace `req.body.user_id` with `req.user.id`
- [ ] Test with 2 different users

### Frontend
- [ ] Replace all `fetch()` with `api.get/post/put/delete`
- [ ] Remove all `?user_id=2` from URLs
- [ ] Remove all `user_id: 2` from request bodies
- [ ] Test login → see only own data
- [ ] Test create data → stored with correct user_id
- [ ] Test with 2 different users → verify isolation

---

## 🎯 Expected Result

### User Baru Register
1. User register → data masuk ke tabel `users`
2. User login → dapat JWT token
3. User access dashboard → **KOSONG** (no default data)
4. User create booking/service/client → data tersimpan dengan `user_id` dari token
5. User hanya bisa lihat data sendiri

### Multi-User Test
1. Alice login → lihat dashboard → EMPTY
2. Alice create 5 bookings
3. Alice logout
4. Bob login → lihat dashboard → **STILL EMPTY** (tidak lihat data Alice)
5. Bob create 3 bookings
6. Bob hanya lihat 3 bookings miliknya
7. Alice login lagi → lihat 5 bookings miliknya (tidak lihat data Bob)

---

## 🚨 Common Issues

### Issue 1: Frontend masih kirim user_id
**Symptom:** Backend log shows `user_id=2` in query
**Fix:** Check if using `api` service, not `fetch`

### Issue 2: 401 Unauthorized
**Symptom:** All API calls return 401
**Fix:** Check token in localStorage, verify not expired

### Issue 3: Masih lihat data user lain
**Symptom:** User A lihat data User B
**Fix:** Backend endpoint belum pakai `enforceTenancy` middleware

---

## 📚 Reference Files

- **Authentication:** `backend/src/middlewares/authMiddleware.js`
- **Auth Controller:** `backend/src/controllers/authController.js`
- **API Service:** `frontend/src/services/api.js`
- **Auth Service:** `frontend/src/services/authService.js`

---

**Good Luck! 🚀**
