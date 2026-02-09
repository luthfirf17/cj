# Fitur Card View - User Dashboard

## 📝 Deskripsi
Fitur Card View memungkinkan pengguna untuk melihat data booking dalam format kartu yang informatif dan mudah dibaca. Fitur ini memberikan alternatif tampilan selain Table View dan Calendar View yang sudah ada.

## ✨ Fitur Utama

### 1. **Tiga Mode Tampilan**
- **Tabel** - Tampilan tradisional dalam bentuk tabel
- **Card** - Tampilan kartu dengan informasi lengkap (BARU!)
- **Kalender** - Tampilan kalender untuk visualisasi jadwal

### 2. **Grid Layout yang Fleksibel**
Card view mendukung pengaturan jumlah kolom dari 3 hingga 6 kolom:
- **3 Kolom** - Ideal untuk layar sedang, menampilkan informasi lebih detail
- **4 Kolom** - Balanced antara detail dan jumlah card yang terlihat
- **5 Kolom** - Untuk layar lebar, menampilkan lebih banyak data sekaligus
- **6 Kolom** - Maksimal density untuk layar sangat lebar

### 3. **Responsive Design**
- Mobile (1 kolom)
- Tablet (2 kolom)
- Desktop Small (3 kolom)
- Desktop Large (4-6 kolom sesuai pengaturan)

### 4. **Informasi Lengkap di Setiap Card**

#### Header Card (Biru Gradient)
- ✅ Nama Klien
- ✅ Nomor Kontak dengan link WhatsApp
- ✅ Status Booking (Badge)

#### Body Card
1. **Layanan**
   - Nama layanan
   - Quantity (jika lebih dari 1)
   - Harga per layanan
   - Penanggung Jawab Layanan (jika ada)
   - Link WhatsApp PJ Layanan

2. **Penanggung Jawab Booking**
   - Daftar semua PJ Booking
   - Link WhatsApp untuk setiap PJ

3. **Waktu & Tempat**
   - Tanggal booking
   - Waktu booking (jika ada)
   - Lokasi dengan link Google Maps (jika ada)

4. **Pembayaran**
   - Status pembayaran (Badge)
   - Total harga
   - Jumlah yang sudah dibayar
   - Sisa pembayaran (jika belum lunas)

#### Footer Card (Action Buttons)
- 🟣 **Invoice** - Generate invoice
- 🔵 **Edit** - Edit booking
- 🔴 **Hapus** - Hapus booking

## 🎨 Desain Visual

### Color Scheme
- **Header**: Blue gradient (from-blue-500 to-blue-600)
- **Status Badges**: 
  - Dijadwalkan: Blue
  - Selesai: Green
  - Dibatalkan: Red
- **Payment Badges**:
  - Lunas: Green
  - DP: Yellow/Orange
  - Belum Bayar: Red
- **Action Buttons**:
  - Invoice: Purple
  - Edit: Blue
  - Delete: Red

### Card Styling
- Rounded corners (rounded-lg)
- Subtle shadow (shadow-sm)
- Hover effect (shadow-md on hover)
- Clean borders (border-gray-200)
- Proper spacing and padding

## 🔍 Fitur Pencarian & Filter

Card view mendukung semua fitur pencarian dan filter yang ada:
- ✅ Search query highlighting
- ✅ Filter berdasarkan status
- ✅ Filter berdasarkan status pembayaran
- ✅ Filter berdasarkan bulan/tahun
- ✅ Filter berdasarkan klien/layanan
- ✅ Multi-criteria sorting

## 📱 Responsive Breakpoints

```javascript
3 Kolom: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
4 Kolom: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
5 Kolom: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5
6 Kolom: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6
```

## 🚀 Cara Penggunaan

1. **Buka User Dashboard**
2. **Klik tombol "Card"** di antara tombol "Tabel" dan "Kalender"
3. **Pilih jumlah kolom** yang diinginkan (3, 4, 5, atau 6)
4. **Scroll** untuk melihat semua card
5. **Gunakan filter dan search** seperti biasa
6. **Klik action buttons** pada card untuk Invoice, Edit, atau Hapus

## 💡 Tips Penggunaan

- **3 Kolom**: Terbaik untuk melihat detail lengkap setiap booking
- **4-5 Kolom**: Balance antara detail dan overview
- **6 Kolom**: Untuk melihat banyak booking sekaligus pada layar lebar
- Gunakan **search** untuk highlight informasi yang dicari
- Klik **status cards** di atas untuk quick filter

## 🔧 Technical Details

### State Management
```javascript
const [viewMode, setViewMode] = useState('table'); // 'table', 'calendar', or 'card'
const [cardColumns, setCardColumns] = useState(3); // 3-6
```

### Icons Used (react-icons/fi)
- FiGrid - Card view icon
- FiColumns - Column settings icon
- FiPackage - Services icon
- FiUser - Responsible party icon
- FiCalendar - Date icon
- FiClock - Time icon
- FiMapPin - Location icon
- FiDollarSign - Payment icon
- FiMessageCircle - WhatsApp icon
- FiFileText - Invoice icon
- FiEdit - Edit icon
- FiTrash2 - Delete icon

## 📊 Performance

- Lazy rendering untuk card yang banyak
- Optimized dengan useMemo untuk filtered dan sorted data
- Smooth transitions dan hover effects
- Efficient re-rendering dengan proper key usage

## 🎯 Future Enhancements (Potensial)

1. Drag & drop untuk reorder cards
2. Quick actions pada hover
3. Expandable cards untuk detail lebih
4. Card customization (user preference)
5. Export cards as PDF
6. Print view untuk card layout

---

**Dibuat**: 26 Januari 2026
**Developer**: Luthfi RF
**Status**: ✅ Implemented & Ready
