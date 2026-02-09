# 🧪 Tests Directory

Folder ini berisi file-file testing untuk aplikasi Catat Jasamu.

## 📁 Struktur

```
tests/
├── test_password.js    # Test untuk fungsi password/security
├── test_token.js       # Test untuk JWT token handling
└── test_update.js      # Test untuk fungsi update data
```

## 🚀 Menjalankan Tests

### Manual Testing

```bash
# Jalankan test tertentu
node tests/test_password.js
node tests/test_token.js
node tests/test_update.js

# Atau jalankan semua test
for file in tests/*.js; do
  echo "Running $file..."
  node "$file"
done
```

### Menggunakan NPM Scripts

Tambahkan ke `package.json` backend:

```json
{
  "scripts": {
    "test": "node tests/test_password.js && node tests/test_token.js && node tests/test_update.js",
    "test:password": "node tests/test_password.js",
    "test:token": "node tests/test_token.js",
    "test:update": "node tests/test_update.js"
  }
}
```

Kemudian jalankan:

```bash
npm test
npm run test:password
```

## 📝 Menambah Test Baru

1. Buat file JavaScript baru di folder `tests/`
2. Ikuti naming convention: `test_[nama_fitur].js`
3. Export fungsi test atau jalankan langsung
4. Update dokumentasi ini

## 🔧 Test Categories

- **Password Tests**: Validasi password hashing, strength checking
- **Token Tests**: JWT generation, validation, expiration
- **Update Tests**: Data validation, business logic testing

## 📊 Test Results

Untuk melihat hasil test, jalankan script dan periksa output console atau log files.