# 🚀 QUICK FIX: Backend Multi-Tenancy (Manual Steps)

Ikuti langkah ini **SATU PER SATU** untuk menghindari syntax error.

---

## ✅ Endpoint Yang Sudah Aman (Tidak Perlu Diubah)

- `GET /api/user/dashboard/stats` ✅
- `GET /api/user/bookings` ✅
- `GET /api/user/services` ✅
- `POST /api/user/services` ✅

---

## ❌ Endpoint Yang Perlu Diperbaiki

### 1. GET /api/user/clients (Line ~375)

**Cari:**
```javascript
app.get('/api/user/clients', async (req, res) => {
  try {
    const userId = req.query.user_id || 2;
```

**Ganti Dengan:**
```javascript
app.get('/api/user/clients', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
```

---

### 2. POST /api/user/clients (Line ~402)

**Cari:**
```javascript
// POST: Create new client
app.post('/api/user/clients', async (req, res) => {
  try {
    const { user_id, name, phone, address } = req.body;

    // Validation
    if (!user_id || !name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'User ID, name, and phone are required'
      });
    }

    const insertQuery = `
      INSERT INTO clients (user_id, name, phone, address, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, name, phone, address
    `;

    const result = await query(insertQuery, [user_id, name, phone, address || null]);
```

**Ganti Dengan:**
```javascript
// POST: Create new client
app.post('/api/user/clients', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, address } = req.body;

    // Validation
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required'
      });
    }

    const insertQuery = `
      INSERT INTO clients (user_id, name, phone, address, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, name, phone, address
    `;

    const result = await query(insertQuery, [userId, name, phone, address || null]);
```

---

### 3. PUT /api/user/clients/:id (Line ~437)

**Cari:**
```javascript
// PUT: Update client
app.put('/api/user/clients/:id', async (req, res) => {
  try {
    const clientId = req.params.id;
    const { name, phone, address } = req.body;
```

Dan cari query UPDATE-nya:
```javascript
    const updateQuery = `
      UPDATE clients 
      SET name = $1, phone = $2, address = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING id, name, phone, address
    `;

    const result = await query(updateQuery, [name, phone, address || null, clientId]);
```

**Ganti Jadi:**
```javascript
// PUT: Update client
app.put('/api/user/clients/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.params.id;
    const { name, phone, address } = req.body;
```

Dan:
```javascript
    const updateQuery = `
      UPDATE clients 
      SET name = $1, phone = $2, address = $3, updated_at = NOW()
      WHERE id = $4 AND user_id = $5
      RETURNING id, name, phone, address
    `;

    const result = await query(updateQuery, [name, phone, address || null, clientId, userId]);
```

---

### 4. DELETE /api/user/clients/:id (Line ~481)

**Cari:**
```javascript
// DELETE: Delete client
app.delete('/api/user/clients/:id', async (req, res) => {
  try {
    const clientId = req.params.id;

    const deleteQuery = `
      DELETE FROM clients 
      WHERE id = $1
      RETURNING id
    `;

    const result = await query(deleteQuery, [clientId]);
```

**Ganti Jadi:**
```javascript
// DELETE: Delete client
app.delete('/api/user/clients/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.params.id;

    const deleteQuery = `
      DELETE FROM clients 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const result = await query(deleteQuery, [clientId, userId]);
```

---

### 5. PUT /api/user/services/:id (Line ~289)

**Cari:**
```javascript
// PUT: Update service
app.put('/api/user/services/:id', async (req, res) => {
  try {
    const serviceId = req.params.id;
```

Dan:
```javascript
    const updateQuery = `
      UPDATE services 
      SET name = $1, description = $2, price = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING id, name, price as default_price, description
    `;

    const result = await query(updateQuery, [
      name,
      description || null,
      default_price || 0,
      serviceId
    ]);
```

**Ganti Jadi:**
```javascript
// PUT: Update service
app.put('/api/user/services/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const serviceId = req.params.id;
```

Dan:
```javascript
    const updateQuery = `
      UPDATE services 
      SET name = $1, description = $2, price = $3, updated_at = NOW()
      WHERE id = $4 AND user_id = $5
      RETURNING id, name, price as default_price, description
    `;

    const result = await query(updateQuery, [
      name,
      description || null,
      default_price || 0,
      serviceId,
      userId
    ]);
```

---

### 6. DELETE /api/user/services/:id (Line ~343)

**Cari:**
```javascript
// DELETE: Delete service
app.delete('/api/user/services/:id', async (req, res) => {
  try {
    const serviceId = req.params.id;

    const deleteQuery = `
      DELETE FROM services 
      WHERE id = $1
      RETURNING id
    `;

    const result = await query(deleteQuery, [serviceId]);
```

**Ganti Jadi:**
```javascript
// DELETE: Delete service
app.delete('/api/user/services/:id', authenticate, enforceTenancy, async (req, res) => {
  try {
    const userId = req.user.id;
    const serviceId = req.params.id;

    const deleteQuery = `
      DELETE FROM services 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const result = await query(deleteQuery, [serviceId, userId]);
```

---

## 🧪 Test Setelah Setiap Perubahan

Setelah edit, save file dan test:

```bash
cd backend
node src/server.js
```

Kalau tidak ada syntax error, berarti berhasil! ✅

---

## 📝 Checklist

- [ ] GET /api/user/clients
- [ ] POST /api/user/clients
- [ ] PUT /api/user/clients/:id
- [ ] DELETE /api/user/clients/:id
- [ ] PUT /api/user/services/:id
- [ ] DELETE /api/user/services/:id

---

**Setelah semua fix, restart server dan test dengan 2 user berbeda!**
