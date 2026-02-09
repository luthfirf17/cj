# Booking Card View Components

## Overview
Komponen-komponen modular untuk menampilkan booking dalam format Card View yang responsive dan interaktif.

## Structure

```
frontend/src/components/booking/
├── BookingCardView.jsx      # Main container
├── BookingCard.jsx           # Single card component
├── ServiceDetailCard.jsx     # Service detail sub-component
└── README.md                 # This file
```

## Components

### 1. BookingCardView.jsx
**Purpose**: Main container untuk grid layout card bookings

**Props**:
- `bookings` (Array): Array of booking objects
- `cardColumns` (Number): Grid columns (3-6)
- `searchQuery` (String): Search query untuk highlighting
- `highlightText` (Function): Function untuk highlight text
- `globalResponsibleParties` (Array): Global responsible parties data
- `serviceResponsibleParties` (Array): Service-responsible mapping data
- `onEdit` (Function): Callback untuk edit booking
- `onDelete` (Function): Callback untuk delete booking
- `onGenerateInvoice` (Function): Callback untuk generate invoice
- `pagination` (Object): Pagination state
- `onPageChange` (Function): Callback untuk page change
- `selectedStatuses` (Array): Selected status filters
- `selectedPaymentStatuses` (Array): Selected payment status filters

**Features**:
- Responsive grid layout (3-6 columns)
- Empty state handling
- Pagination support
- Search result messaging

**Usage**:
```jsx
<BookingCardView
  bookings={sortedBookings}
  cardColumns={3}
  searchQuery={query}
  highlightText={highlightFn}
  globalResponsibleParties={globalRP}
  serviceResponsibleParties={serviceRP}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onGenerateInvoice={handleInvoice}
  pagination={paginationState}
  onPageChange={setPage}
  selectedStatuses={statuses}
  selectedPaymentStatuses={paymentStatuses}
/>
```

---

### 2. BookingCard.jsx
**Purpose**: Single booking card dengan semua informasi detail

**Props**:
- `booking` (Object): Booking object
- `searchQuery` (String): Search query untuk highlighting
- `highlightText` (Function): Function untuk highlight text
- `globalResponsibleParties` (Array): Global responsible parties data
- `serviceResponsibleParties` (Array): Service-responsible mapping data
- `onEdit` (Function): Callback untuk edit
- `onDelete` (Function): Callback untuk delete
- `onGenerateInvoice` (Function): Callback untuk invoice

**Features**:
- Fixed height (600px) dengan scrollable content
- Client information display
- Services list dengan pricing
- Responsible parties (booking & service level)
- Date, time, location information
- Payment status badge
- Action buttons (Invoice, Edit, Delete)

**Layout Sections**:
1. **Header**: Client name, contact (WhatsApp link), status badge
2. **Body (Scrollable)**:
   - Services section
   - Booking responsible parties
   - Price summary
   - Date, time, location
   - Payment status badge
3. **Footer**: Action buttons

**Usage**:
```jsx
<BookingCard
  booking={bookingData}
  searchQuery="search"
  highlightText={highlightFn}
  globalResponsibleParties={globalRP}
  serviceResponsibleParties={serviceRP}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onGenerateInvoice={handleInvoice}
/>
```

---

### 3. ServiceDetailCard.jsx
**Purpose**: Detail card untuk single service dengan pricing dan responsible party

**Props**:
- `service` (Object): Service object
- `index` (Number): Service index untuk numbering
- `searchQuery` (String): Search query untuk highlighting
- `highlightText` (Function): Function untuk highlight text
- `responsibleParty` (Object|null): Responsible party object

**Features**:
- Service numbering
- Service name display
- Price breakdown:
  - Harga satuan (unit price)
  - Jumlah (quantity)
  - Total harga (total price with calculation)
- Responsible party info (conditional):
  - Name
  - Phone number
  - WhatsApp link
- Hover effects

**Service Object Structure**:
```javascript
{
  id: Number,
  name: String,
  quantity: Number,
  price: Number,          // Unit price
  total_price: Number     // Total price
}
```

**Usage**:
```jsx
<ServiceDetailCard
  service={serviceData}
  index={0}
  searchQuery="search"
  highlightText={highlightFn}
  responsibleParty={rpData}
/>
```

---

## Responsive Breakpoints

Grid layout berdasarkan `cardColumns`:

| Columns | Breakpoints |
|---------|------------|
| 3 | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` |
| 4 | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` |
| 5 | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5` |
| 6 | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6` |

## Dependencies

### Required Utilities:
- `format.currency()` - Currency formatting from `../../utils/format`
- `getWhatsAppLink()` - WhatsApp link generator from `../../utils/helpers`

### Required Components:
- `Badge` - from `../common/Badge`

### Required Icons (react-icons/fi):
- FiMessageCircle, FiPackage, FiUser, FiDollarSign
- FiCalendar, FiClock, FiMapPin
- FiFileText, FiEdit, FiTrash2

## Styling

### Tailwind Classes Used:
- Gradients: `bg-gradient-to-r`, `bg-gradient-to-br`
- Borders: `border-2`, `border-gray-200`, `border-blue-200`
- Shadows: `shadow-md`, `hover:shadow-xl`
- Scrollbar: `scrollbar-thin`, `scrollbar-thumb-gray-300`
- Responsive: `md:`, `lg:`, `xl:`, `2xl:`, `3xl:`

### Color Scheme:
- **Blue**: Services, Client info
- **Green**: Pricing, WhatsApp links, Maps
- **Purple**: Responsible parties
- **Indigo**: Date/Time
- **Red/Pink**: Unpaid/Remaining payment

## Best Practices

1. **Component Reusability**: Setiap component bisa digunakan independent
2. **Props Validation**: Gunakan PropTypes di production
3. **Performance**: Gunakan React.memo() untuk optimize re-render
4. **Accessibility**: Tambahkan ARIA labels untuk screen readers
5. **Error Handling**: Tambahkan fallback untuk missing data

## Future Improvements

- [ ] Add PropTypes validation
- [ ] Add unit tests
- [ ] Add loading skeleton states
- [ ] Add animation transitions
- [ ] Add keyboard navigation support
- [ ] Add print-friendly layout
- [ ] Add export to PDF functionality
- [ ] Add bulk actions support

## Migration Notes

**Before** (UserDashboard.jsx):
- 2,700+ lines
- Card View logic embedded (~400 lines)
- Hard to maintain and debug

**After**:
- UserDashboard.jsx: ~1,500 lines (45% reduction)
- BookingCardView: ~130 lines
- BookingCard: ~300 lines
- ServiceDetailCard: ~130 lines
- Total: ~2,060 lines (modular, maintainable)

**Benefits**:
✅ Easier debugging
✅ Reusable components
✅ Better code organization
✅ Faster development
✅ Easier testing
