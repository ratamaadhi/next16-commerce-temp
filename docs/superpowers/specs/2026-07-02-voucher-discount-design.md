# Voucher / Kode Diskon (Sisi Next.js) — Design Spec

> **Status:** Design Approved
> **Date:** 2026-07-02
> **Project:** next-commerce-temp

---

## 1. Ringkasan

Fitur kode voucher diskon (persen atau nominal tetap) yang bisa dipasang pelanggan di halaman cart, berlaku dengan syarat minimum belanja dan dibatasi kuota (total & per pelanggan). Field `discount` sudah ada di skema `Order` (`types/strapi.d.ts`) tapi selama ini selalu `0` — fitur ini yang pertama kali benar-benar mengisinya.

**Di luar scope v1** (sengaja tidak dibangun dulu, YAGNI):
- Voucher gratis ongkir (tipe terpisah, bukan bagian dari persen/nominal)
- Stacking lebih dari 1 voucher per order
- Voucher yang ditargetkan ke user tertentu (semua voucher bersifat publik)
- Diskon memotong ongkir (diskon hanya berlaku ke subtotal produk)

**Terkait tapi terpisah:** validasi otoritatif & lifecycle hook di backend Strapi didokumentasikan di `docs/superpowers/specs/2026-07-02-voucher-strapi-backend-design.md` — dokumen itu dikerjakan di repo Strapi, bukan repo ini. Dokumen ini (Next.js) hanya bisa jalan penuh setelah content-type `Voucher` dan relasi `Order.voucher` tersedia di Strapi.

---

## 2. Model Data (ringkas)

Detail schema lengkap ada di dokumen Strapi backend. Yang perlu diketahui dari sisi Next.js:

**Voucher** (`api::voucher.voucher`) — field yang dipakai di frontend:
`code`, `discountType` (`percentage` | `fixed`), `discountValue`, `maxDiscountAmount`, `minPurchase`, `usageLimit`, `usageLimitPerUser`, `startDate`, `endDate`, `isActive`.

**Order** — tambahan relasi `voucher` (manyToOne → Voucher, optional). Field `discount` (sudah ada) diisi hasil hitungan, bukan dikirim mentah dari client (lihat §7 Keamanan).

Setelah content-type Strapi tersedia, jalankan `pnpm codegen` (atau perintah openapi-typescript yang dipakai project ini) untuk regenerasi `types/strapi.d.ts` agar `Voucher` muncul sebagai type.

---

## 3. Perhitungan Diskon & Pajak

```
subtotal (dari cart)
  − diskon
  = DPP (dasar pengenaan pajak)
  + pajak 11% × DPP
  + ongkir (tidak kena diskon)
  = total
```

**Kenapa pajak dihitung setelah diskon:** PPN di Indonesia dikenakan pada harga yang benar-benar dibayar pelanggan (harga net), bukan harga sebelum diskon. Ini mengubah `app/checkout/page.tsx:64` dari `tax = subtotal * TAX_RATE` menjadi `tax = (subtotal - discount) * TAX_RATE`.

**Formula hitung diskon** — `lib/vouchers.ts`, fungsi murni `computeDiscount(voucher, subtotal)`:

```typescript
function computeDiscount(voucher: VoucherRules, subtotal: number): number {
  let discount = voucher.discountType === "percentage"
    ? subtotal * (voucher.discountValue / 100)
    : voucher.discountValue;

  if (voucher.discountType === "percentage" && voucher.maxDiscountAmount) {
    discount = Math.min(discount, voucher.maxDiscountAmount);
  }

  // nominal tetap tidak boleh melebihi subtotal (mencegah total negatif)
  return Math.round(Math.min(discount, subtotal));
}
```

Fungsi ini dipakai di dua tempat: preview di cart (client, reaktif) dan re-hitung di `/api/orders` (server, sebelum dikirim ke Strapi). Nilai final yang benar-benar tersimpan tetap ditentukan lifecycle hook Strapi — lihat §7.

---

## 4. API Route Handlers (Next.js BFF Proxy)

### `app/api/vouchers/apply/route.ts` — POST

**Body:** `{ code: string, subtotal: number }`

**Perilaku:**
- Baca token dari `cookies().get("token")` — **opsional** di sini (beda dari route lain), karena cart bisa diakses sebelum login. Kalau tidak ada token, skip cek kuota-per-user (cek final tetap terjadi otoritatif di server saat order dibuat, lihat §7).
- Proxy ke Strapi: `GET /vouchers?filters[code][$eqi]=<code>` (operator `$eqi` = case-insensitive equals, jadi kode tidak perlu dipaksa uppercase di database).
- Kalau tidak ketemu → `{ valid: false, reason: "not_found", message: "Kode voucher tidak ditemukan" }`
- Cek berurutan (pesan error paling actionable duluan): `isActive` → tanggal berlaku → `minPurchase` vs `subtotal` → (kalau ada token) kuota total → kuota per-user.
- Kalau lolos semua → hitung `discountAmount` via `computeDiscount()`, return:
  ```json
  {
    "valid": true,
    "voucherDocumentId": "...",
    "code": "HEMAT20K",
    "discountType": "fixed",
    "discountValue": 20000,
    "maxDiscountAmount": null,
    "minPurchase": 100000,
    "discountAmount": 20000
  }
  ```
- Response tetap `200` baik valid maupun tidak (bukan 4xx) — `valid: false` + `reason` + `message` cukup untuk UI menampilkan toast tanpa perlu parsing status code.

### Perubahan `app/api/orders/route.ts`

- Body tambahan: `voucherDocumentId?: string`.
- Kalau ada `voucherDocumentId`: re-fetch voucher dari Strapi, panggil ulang `computeDiscount(voucher, body.subtotal)` — **abaikan** `body.discount` yang dikirim client, timpa dengan hasil hitungan server ini.
- Kirim ke Strapi `POST /orders` dengan `data.voucher = voucherDocumentId` dan `data.discount` hasil hitungan server.
- Kalau Strapi menolak (lifecycle hook gagal validasi, misal kuota sudah habis karena race condition) → Strapi balas 400 dengan pesan error → diteruskan apa adanya ke client (pola yang sama seperti `StrapiError` yang sudah ada di file ini).

---

## 5. State Management

Extend `hooks/use-cart.ts` (`useCartStore`):

```typescript
interface AppliedVoucher {
  documentId: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxDiscountAmount?: number;
  minPurchase: number;
}

interface CartStore {
  // ...existing fields
  appliedVoucher: AppliedVoucher | null;
  setAppliedVoucher: (voucher: AppliedVoucher | null) => void;
  getDiscount: () => number; // computeDiscount(appliedVoucher, getTotal()), atau 0 kalau null/di bawah minPurchase
}
```

**Kenapa yang disimpan adalah *rules* voucher, bukan angka diskon jadi:** dengan begitu `getDiscount()` otomatis menyesuaikan tiap kali `items` berubah (tambah/kurang barang) tanpa perlu panggil `/api/vouchers/apply` ulang setiap edit cart — cukup panggil ulang saat user mengetik kode baru. Kalau `getTotal() < appliedVoucher.minPurchase`, `getDiscount()` mengembalikan `0` dan UI menampilkan pesan "kurang Rp X lagi" alih-alih auto-clear voucher (supaya kalau user menambah barang lagi, voucher otomatis aktif kembali tanpa perlu input ulang).

---

## 6. Components

**Baru — `components/cart/voucher-input.tsx`:**
- Input teks + tombol "Terapkan". Saat submit → `POST /api/vouchers/apply` dengan `subtotal = getTotal()`.
- Sukses → `setAppliedVoucher(rules)` + toast sukses.
- Gagal → toast error dengan `message` dari response, tidak mengubah state.
- Kalau `appliedVoucher` sudah terpasang: tampilkan sebagai chip (`HEMAT20K ✕`) menggantikan input, tombol ✕ memanggil `setAppliedVoucher(null)`.

**Ubah — `app/cart/page.tsx`:** pasang `<VoucherInput />` di panel Ringkasan, tambah baris "Diskon" (warna hijau/positif, `− formatPrice(getDiscount())`) di antara Subtotal dan Total, hanya tampil kalau `getDiscount() > 0`.

**Ubah — `components/checkout/order-summary.tsx`:** tambah prop `discount: number`, render baris "Diskon" antara Subtotal dan Pajak (mengikuti urutan formula §3). Tidak perlu input voucher baru di sini — voucher sudah dipasang dari cart, checkout hanya menampilkan & meneruskan.

**Ubah — `app/checkout/page.tsx`:** baca `appliedVoucher` & `getDiscount()` dari `useCartStore`, hitung ulang `tax = Math.round((subtotal - discount) * TAX_RATE)`, kirim `voucherDocumentId` + `discount` ke `POST /api/orders`.

---

## 7. Keamanan & Validasi Berlapis

Ada 3 lapis, dari yang paling cepat (UX) ke yang paling otoritatif:

1. **Client (`getDiscount()`)** — instan, tanpa network call, untuk preview reaktif di cart.
2. **Next.js `/api/orders`** — re-validasi & re-hitung server-side sebelum diteruskan ke Strapi. Menutup celah manipulasi `discount` lewat DevTools kalau request tetap lewat Next.js.
3. **Strapi lifecycle hook (`beforeCreate` di Order)** — lapis final, jalan di server Strapi apa pun jalur request-nya (termasuk kalau seseorang memanggil Strapi langsung dengan JWT, melewati Next.js sama sekali). Ini satu-satunya lapis yang benar-benar tidak bisa dilewati. **Detail lengkap ada di dokumen backend Strapi**, karena kodenya hidup di repo Strapi, bukan di sini.

Next.js **tidak boleh** mempercayai `body.discount` dari client untuk apa pun — baik di preview maupun saat membuat order, nilai selalu dihitung ulang dari data voucher yang diambil dari Strapi.

---

## 8. Error & Edge Cases

| Skenario | Handling |
|---|---|
| Kode tidak ditemukan | Toast "Kode voucher tidak ditemukan" |
| Voucher tidak aktif / kadaluarsa | Toast pesan spesifik dari `reason` |
| Subtotal di bawah `minPurchase` | Chip voucher tetap terpasang, `getDiscount()` = 0, teks "Kurang Rp X lagi untuk pakai voucher ini" |
| Kuota total/per-user habis (baru diketahui saat submit) | Voucher lolos preview di cart tapi ditolak Strapi saat checkout → toast "Voucher sudah tidak tersedia, silakan lanjut tanpa voucher", `setAppliedVoucher(null)`, biarkan user submit ulang |
| User belum login coba pakai kode | Preview tetap jalan (tanpa cek kuota-per-user), tapi checkout tetap wajib login dulu (perilaku existing, tidak berubah) |
| Cart dikosongkan setelah voucher terpasang | `getDiscount()` = 0 otomatis (subtotal 0 < minPurchase manapun), tidak perlu penanganan khusus |

---

## 9. Testing

Ikuti pola `lib/__tests__/orders.test.ts` yang sudah ada (Vitest):

- `lib/__tests__/vouchers.test.ts` — unit test `computeDiscount()`: persen dengan & tanpa cap, nominal tetap, nominal tetap melebihi subtotal (harus di-clamp), pembulatan.
- Test `getDiscount()` di `useCartStore`: reaktif terhadap perubahan `items`, kembali 0 kalau di bawah `minPurchase`.
- Test route `/api/vouchers/apply`: tiap `reason` (not_found, inactive, expired, min_purchase, quota_exceeded) — mock `strapiFetch`.

---

## 10. File Checklist

```
app/
  api/vouchers/apply/route.ts       # BARU — validasi & preview diskon
  api/orders/route.ts               # UBAH — re-hitung discount server-side, kirim voucherDocumentId
  cart/page.tsx                     # UBAH — pasang VoucherInput, baris Diskon
  checkout/page.tsx                 # UBAH — tax dihitung dari (subtotal - discount), kirim voucher ke order

components/
  cart/voucher-input.tsx            # BARU
  checkout/order-summary.tsx        # UBAH — prop & baris discount

hooks/
  use-cart.ts                       # UBAH — appliedVoucher, setAppliedVoucher, getDiscount

lib/
  vouchers.ts                       # BARU — computeDiscount(), tipe VoucherRules

types/strapi.d.ts                   # REGENERASI setelah content-type Voucher ada di Strapi
```
