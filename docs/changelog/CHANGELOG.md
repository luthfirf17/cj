# Changelog - Catat Jasamu

## [Update] October 30, 2025 - Enhanced Add Booking Modal

### ✨ Fitur Baru yang Ditambahkan

#### 1. **Mode Layanan (Single vs Multiple)**
- Toggle untuk memilih antara "Single Layanan" atau "Multiple Layanan"
- **Single Layanan**: Hanya bisa memilih 1 jenis layanan
- **Multiple Layanan**: Bisa menambah lebih dari 1 layanan dalam 1 booking

#### 2. **Dynamic Service Selection**
- Dropdown untuk setiap layanan dengan nama dan harga
- Tombol **"+ Tambah Layanan"** untuk menambah row layanan baru (mode multiple)
- Tombol hapus (ikon sampah) untuk menghapus layanan tertentu
- Custom price per layanan (bisa override harga default)
- Link **"+ Tambah Layanan Baru"** untuk membuat layanan baru (placeholder)

#### 3. **Checkbox "Booking lebih dari 1 hari"**
- Opsi untuk booking yang berlangsung lebih dari 1 hari
- Field tersimpan sebagai `is_future_booking`

#### 4. **Enhanced Payment Section**
- **Diskon (Rp)**: Input untuk diskon dalam nominal rupiah
- **PPN (%)**: Input untuk pajak dalam persentase (0-100%)
- **Biaya Tambahan**: 
  - Bisa menambah multiple biaya tambahan (ongkir, parkir, dll)
  - Setiap biaya punya nama dan nominal
  - Tombol **"+ Tambah Biaya"** untuk menambah row baru
  - Tombol hapus untuk setiap biaya

#### 5. **Total Summary Box**
- Box biru dengan ringkasan pembayaran:
  - Total Biaya Keseluruhan (bold, besar)
  - Sisa yang harus dibayar
  - Auto-update saat ada perubahan

### 🔄 Perubahan Struktur Data

#### State `formData` yang diupdate:
```javascript
{
  // ... existing fields
  is_future_booking: false,
  service_mode: 'single', // 'single' or 'multiple'
  selected_services: [{ service_id: '', custom_price: 0 }], // Array of objects
  tax_percentage: 0,
  additional_fees: [{ name: '', amount: 0 }], // Array of objects
}
```

### 📊 Perhitungan Total Otomatis

Total dihitung dengan formula:
```
Subtotal = Sum(all service prices)
Subtotal = Subtotal - Discount
Tax = Subtotal * (PPN% / 100)
Subtotal = Subtotal + Tax
Total = Subtotal + Sum(all additional fees)
```

### 🎨 UI/UX Improvements

1. **Service Row Management**:
   - Setiap layanan punya row sendiri dengan nama dan harga
   - Visual feedback saat hover
   - Icon trash untuk hapus

2. **Additional Fees Management**:
   - Empty state dengan pesan "Belum ada biaya tambahan"
   - Row dinamis untuk setiap biaya
   - Field nama biaya dan nominal

3. **Payment Summary**:
   - Background biru highlight untuk total
   - Font besar untuk total keseluruhan
   - Sisa pembayaran ditampilkan jelas

### 🔧 Helper Functions Baru

- `handleServiceModeChange(mode)` - Toggle mode layanan
- `addServiceRow()` - Tambah row layanan baru
- `removeServiceRow(index)` - Hapus row layanan
- `updateServiceRow(index, field, value)` - Update data layanan
- `addAdditionalFee()` - Tambah biaya tambahan
- `removeAdditionalFee(index)` - Hapus biaya tambahan
- `updateAdditionalFee(index, field, value)` - Update biaya tambahan

### 📝 Notes

- Backend masih menggunakan `service_id` tunggal (single service)
- Multiple services akan membutuhkan update backend API
- Fitur "Tambah Layanan Baru" masih placeholder (alert)
- Data `additional_fees` dan multiple services belum disimpan ke database

### 🚀 Next Steps

1. Update backend API untuk support multiple services per booking
2. Implementasi modal "Tambah Layanan Baru"
3. Save `additional_fees` ke database (perlu table baru?)
4. Save `is_future_booking` flag
5. Validasi untuk custom price
6. Searchable dropdown untuk service selection

---

**Referensi Design**: https://catatklien.mocha.app/
