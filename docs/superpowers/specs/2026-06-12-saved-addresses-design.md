# Saved Addresses Feature Design

## Date: 2026-06-12
## Status: Approved
## Scope: Account Address Book + Checkout Integration

---

## 1. Overview

User dapat menyimpan alamat pengiriman untuk digunakan kembali saat checkout. Fitur ini mencakup:

1. **Account Address Management** — CRUD alamat via tab `/account`
2. **Checkout Integration** — Pilih alamat tersimpan saat checkout, atau tambah baru
3. **Auto-save** — Simpan alamat baru dari checkout dengan checkbox

---

## 2. User Flow

### 2.1 Account Page (Address Tab)

```
User navigasi ke /account
  → Tab "Alamat" aktif
  → GET /api/addresses (list)
  → Tampilkan list address cards
  
  [Tambah Alamat] → Buka Sheet/Modal
    → Isi form (Label, Nama, Telepon, Alamat, Kecamatan)
    → Submit → POST /api/addresses
    → Success → Invalidate query, toast, close modal
  
  [Edit] → Buka Sheet dengan data pre-filled
    → Edit field
    → Submit → PUT /api/addresses/:id
    → Success → Invalidate query, toast, close modal
  
  [Jadikan Default] → PATCH /api/addresses/:id/default
    → Success → Optimistic update, swap badge
  
  [Delete] → AlertDialog konfirmasi
    → Confirm → DELETE /api/addresses/:id
    → Success → Optimistic remove, toast
```

### 2.2 Checkout Flow

```
User di /checkout
  → GET /api/addresses (if authenticated)
  → Tampilkan address cards di atas form
  
  Case A: Punya alamat tersimpan
    → Default address auto-selected
    → Form auto-terisi dengan data alamat
    → User bisa edit form (manual override)
  
  Case B: Tidak punya alamat / Guest
    → Hanya card "Tambah Alamat Baru"
    → Form kosong, user isi manual
  
  [Checkbox] "Simpan alamat untuk penggunaan berikutnya"
    → Muncul jika: user logged in + (new address OR edited existing)
    → Default: unchecked
    → Saat submit: kalau checked, POST /api/addresses dulu
  
  [Checkbox] "Alamat penagihan sama dengan pengiriman"
    → Default: checked
    → Unchecked: muncul billing address form (identical)
  
  Submit Order → POST /api/orders
    → shippingAddress = form data
    → billingAddress = form data (atau billing form jika unchecked)
```

---

## 3. UI Architecture

### 3.1 Account Page Structure

```
app/account/page.tsx
  └── Tabs (Profil | Alamat | Pesanan)
    └── AddressTab (client component)
      ├── AddressList
      │   ├── AddressCard (×N)
      │   └── EmptyState
      └── AddressSheet (add/edit)
        └── AddressForm
```

### 3.2 Checkout Page Structure

```
app/checkout/page.tsx
  └── AddressSection
      ├── AddressSelector (radio cards)
      │   ├── SavedAddressCard (×N)
      │   └── AddNewAddressCard
      └── AddressForm (inline)
          ├── FormFields (same as existing checkout)
          ├── SaveCheckbox
          └── BillingSameCheckbox
```

---

## 4. API Design

### 4.1 Next.js Route Handlers

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/addresses` | GET | List all addresses (proxy ke Strapi) |
| `/api/addresses` | POST | Create address (proxy ke Strapi) |
| `/api/addresses/[id]` | PUT | Update address (proxy ke Strapi) |
| `/api/addresses/[id]` | DELETE | Delete address (proxy ke Strapi) |
| `/api/addresses/[id]/default` | PATCH | Set default (proxy ke Strapi) |

### 4.2 Request/Response Format

**POST /api/addresses**
```json
{
  "data": {
    "label": "Rumah",
    "firstName": "Budi",
    "lastName": "Santoso",
    "phone": "08123456789",
    "addressLine1": "Jl. Merdeka No. 123",
    "city": "Jakarta",
    "state": "DKI Jakarta",
    "postalCode": "12345",
    "country": "Indonesia",
    "isDefault": false
  }
}
```

**GET /api/addresses**
```json
{
  "data": [
    {
      "documentId": "...",
      "label": "Rumah",
      "firstName": "Budi",
      "lastName": "Santoso",
      "phone": "08123456789",
      "addressLine1": "Jl. Merdeka No. 123",
      "city": "Jakarta",
      "state": "DKI Jakarta",
      "postalCode": "12345",
      "country": "Indonesia",
      "isDefault": true
    }
  ]
}
```

### 4.3 Checkout Data Mapping

Alamat dari checkout form (field yang ada sekarang):
- `firstName` → `firstName`
- `lastName` → `lastName`
- `phone` → `phone`
- `addressLine1` → `addressLine1`
- `city` → dari `selectedSubdistrict.title` (parse kota)
- `state` → dari `selectedSubdistrict.title` (parse provinsi)
- `postalCode` → "" (tidak ada di form)
- `country` → "Indonesia"
- `isDefault` → dari checkbox (false kecuali explicit)

---

## 5. Component Specifications

### 5.1 AddressCard

```
Props:
  address: Address
  isDefault: boolean
  onEdit: () => void
  onDelete: () => void
  onSetDefault: () => void
  onSelect: () => void (checkout mode)
  selected: boolean (checkout mode)

UI:
  - Border: border-border (#E8DDD8)
  - Selected: ring-2 ring-primary (#D4A373)
  - Default badge: bg-primary text-white rounded-full
  - Hover: subtle shadow/shift
  - Actions: Edit | Delete (account) | Select (checkout)
```

### 5.2 AddressForm

```
Fields:
  - Label (optional, text): "Rumah", "Kantor", etc.
  - FirstName (required, text)
  - LastName (required, text)
  - Phone (required, tel)
  - AddressLine1 (required, text)
  - City (hidden, dari subdistrict)
  - State (hidden, dari subdistrict)
  - PostalCode (hidden, kosong)
  - Country (hidden, "Indonesia")
  - IsDefault (hidden, false)

Validation:
  - Required fields: firstName, lastName, phone, addressLine1
  - Phone: minimal 10 digit
  - Subdistrict: wajib (checkout only)

Submit:
  - Loading: button disabled + spinner
  - Error: field-level error + toast
  - Success: toast + invalidate query
```

### 5.3 AddressSelector (Checkout)

```
Props:
  addresses: Address[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAddNew: () => void

UI:
  - Cards: grid-cols-3 (lg), 2 (md), 1 (sm)
  - Last card: "+ Tambah Alamat Baru"
  - Default address auto-selected on mount
```

---

## 6. Data Flow

### 6.1 Server State (React Query)

```typescript
// Query keys
const addressKeys = {
  all: ["addresses"] as const,
  lists: () => [...addressKeys.all, "list"] as const,
  list: (filters: string) => [...addressKeys.lists(), { filters }] as const,
  details: () => [...addressKeys.all, "detail"] as const,
  detail: (id: string) => [...addressKeys.details(), id] as const,
};

// Mutations
useCreateAddress()
useUpdateAddress()
useDeleteAddress()
useSetDefaultAddress()
```

### 6.2 Checkout State

```typescript
// Local state (useState)
const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
const [formData, setFormData] = useState<AddressFormData>({
  firstName: "",
  lastName: "",
  phone: "",
  addressLine1: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Indonesia",
});
const [saveAddress, setSaveAddress] = useState(false);
const [billingSame, setBillingSame] = useState(true);
```

### 6.3 Auto-fill Logic

```typescript
// When address selected
useEffect(() => {
  if (selectedAddressId && addresses) {
    const addr = addresses.find(a => a.documentId === selectedAddressId);
    if (addr) {
      setFormData({
        firstName: addr.firstName,
        lastName: addr.lastName,
        phone: addr.phone,
        addressLine1: addr.addressLine1,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country,
      });
    }
  }
}, [selectedAddressId, addresses]);
```

---

## 7. Error Handling

| Status | UX |
|--------|-----|
| 401 (Unauthorized) | Redirect ke login, toast "Silakan login" |
| 403 (Forbidden) | Toast "Anda tidak memiliki akses" |
| 404 (Not Found) | Toast "Alamat tidak ditemukan", remove dari UI |
| 422 (Validation) | Field-level errors (shadcn Form) |
| Network Error | Toast "Gagal memuat. Silakan coba lagi." |
| 500 (Server) | Toast "Terjadi kesalahan. Hubungi admin." |

---

## 8. Edge Cases

1. **User delete default address** → Backend auto-set another as default, or user must set new default first
2. **User has max addresses** → Limit di Strapi? No, unlimited
3. **Guest user checkout** → No saved addresses, form kosong, checkbox "Simpan" hidden
4. **Subdistrict not in saved address** → Address hanya simpan city/state, tidak simpan subdistrict ID. Saat checkout, user perlu search subdistrict lagi.
5. **Edit address while checkout** → Edit di account, tidak di checkout. Checkout hanya pilih.
6. **Billing different from shipping** → Muncul form billing identikal, data disimpan terpisah di order.

---

## 9. Design System Compliance

- **Colors**: Primary #D4A373, Border #E8DDD8, Background #FFFBF7
- **Typography**: Playfair (heading), Inter (body)
- **Cards**: bg-card, rounded-lg, border-border, shadow-sm
- **Buttons**: Primary solid, h-11 px-6
- **Icons**: lucide-react, size-4/5
- **Animations**: fadeInUp 0.7s, hover translateY -4px

---

## 10. Files to Create/Modify

### New Files
```
app/api/addresses/route.ts
app/api/addresses/[id]/route.ts
app/api/addresses/[id]/default/route.ts
hooks/use-addresses.ts
components/addresses/address-card.tsx
components/addresses/address-form.tsx
components/addresses/address-list.tsx
components/addresses/address-sheet.tsx
components/addresses/address-selector.tsx
components/addresses/empty-state.tsx
```

### Modified Files
```
app/account/page.tsx          → Add tab "Alamat"
app/checkout/page.tsx          → Add address selector + save checkbox
components/checkout/order-summary.tsx → Possibly update
```

---

## 11. Testing Checklist

- [ ] Create address from account
- [ ] Edit address from account
- [ ] Delete address from account
- [ ] Set default address
- [ ] Select address at checkout (auto-fill)
- [ ] Add new address at checkout
- [ ] Save address from checkout (checkbox)
- [ ] Billing different from shipping
- [ ] Guest checkout (no saved addresses)
- [ ] Empty state (no addresses)
- [ ] Error handling (401, 403, 404, 500)
- [ ] Responsive (mobile, tablet, desktop)

---

*Design approved by: User*
*Date: 2026-06-12*
