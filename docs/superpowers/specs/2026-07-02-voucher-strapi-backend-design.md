# Voucher / Kode Diskon (Sisi Strapi5 Backend) — Design Spec

> **Status:** Design Approved
> **Date:** 2026-07-02
> **Target repo:** Strapi backend (repo terpisah dari `next-commerce-temp`, tidak tersedia di sini)
> **Untuk:** agent/developer yang mengerjakan backend Strapi

---

## 0. Konteks (dibaca sendiri, tanpa perlu dokumen lain)

`next-commerce-temp` adalah template e-commerce (Next.js 16 + Strapi v5 CMS) yang dijual ke klien UMKM di Indonesia. Sedang dibangun fitur **kode voucher diskon**: pelanggan memasukkan kode di halaman keranjang, dapat potongan harga (persen atau nominal tetap), dengan syarat minimum belanja dan kuota pemakaian terbatas.

Frontend Next.js akan mengirim `POST /api/orders` (proxy ke Strapi `POST /orders`) dengan field tambahan `voucher` (relasi ke Voucher) dan `discount` (angka). **Frontend TIDAK BOLEH DIPERCAYA sepenuhnya** — nilai `discount` yang dikirim dari client bisa dimanipulasi (lewat DevTools, atau dengan memanggil Strapi langsung menggunakan JWT yang dicuri dari cookie, melewati Next.js sama sekali). Tugas backend ini adalah jadi **lapis validasi terakhir yang tidak bisa dilewati**: content-type baru `Voucher`, relasi di `Order`, dan lifecycle hook yang menghitung ulang & memvalidasi semuanya di server, apa pun jalur request-nya.

Order content-type yang sudah ada sekarang punya field `subtotal`, `tax`, `shippingCost`, `discount`, `totalAmount`, relasi `user`. Field `discount` sudah ada tapi selama ini tidak pernah divalidasi — fitur ini yang pertama kali mengisinya secara nyata.

---

## 1. Content-Type Baru: `Voucher`

`api::voucher.voucher` — collection type, tanpa draft/publish (voucher langsung aktif begitu dibuat, dikontrol lewat field `isActive`, bukan lewat status publish).

### Schema (`src/api/voucher/content-types/voucher/schema.json`)

```json
{
  "kind": "collectionType",
  "collectionName": "vouchers",
  "info": {
    "singularName": "voucher",
    "pluralName": "vouchers",
    "displayName": "Voucher",
    "description": "Kode diskon/voucher promo"
  },
  "options": {
    "draftAndPublish": false
  },
  "attributes": {
    "code": {
      "type": "string",
      "required": true,
      "unique": true
    },
    "discountType": {
      "type": "enumeration",
      "enum": ["percentage", "fixed"],
      "required": true
    },
    "discountValue": {
      "type": "decimal",
      "required": true,
      "min": 0
    },
    "maxDiscountAmount": {
      "type": "decimal",
      "min": 0
    },
    "minPurchase": {
      "type": "decimal",
      "min": 0,
      "default": 0
    },
    "usageLimit": {
      "type": "integer",
      "min": 1
    },
    "usageLimitPerUser": {
      "type": "integer",
      "min": 1,
      "default": 1
    },
    "startDate": {
      "type": "datetime"
    },
    "endDate": {
      "type": "datetime"
    },
    "isActive": {
      "type": "boolean",
      "required": true,
      "default": true
    },
    "description": {
      "type": "text"
    }
  }
}
```

**Catatan field:**
- `discountValue`: kalau `discountType = "percentage"`, nilainya 0–100. Kalau `"fixed"`, nilainya nominal Rupiah. Tidak ada validasi silang di schema.json (Strapi tidak mendukung conditional validation di level schema) — validasi ini terjadi di lifecycle hook (§3).
- `maxDiscountAmount`: cap nominal, cuma dipakai kalau `discountType = "percentage"`. Kosongkan/`null` untuk voucher `"fixed"`.
- `usageLimit` kosong/`null` = tanpa batas total. `usageLimitPerUser` default `1` (satu pelanggan cuma bisa pakai sekali).
- **Tidak ada field counter pemakaian** di content-type ini dengan sengaja — jumlah pemakaian dihitung dari `COUNT(Order WHERE voucher = X)` saat validasi (lihat §3), bukan disimpan sebagai counter terpisah. Ini menghindari race condition antara "baca counter" dan "tulis counter" yang butuh locking tambahan.

### Permissions (Settings → Users & Permissions → Roles, lewat Admin Panel, bukan kode)

| Role | `find` / `findOne` | `create` / `update` / `delete` |
|---|---|---|
| Public | ✅ aktifkan | ❌ tetap nonaktif |
| Authenticated | ✅ aktifkan | ❌ tetap nonaktif |

**Kenapa `find`/`findOne` harus Public (bukan cuma Authenticated):** di frontend, pelanggan bisa mencoba kode voucher di halaman keranjang **sebelum login** (login baru wajib saat checkout). Kalau role Public tidak boleh baca Voucher, preview kode di keranjang akan gagal dengan 403 untuk pengunjung yang belum login.

Pembuatan/edit voucher hanya lewat Admin Panel (Content Manager), yang punya sistem RBAC sendiri terpisah dari `users-permissions` — jadi tidak perlu diaktifkan di role manapun untuk `create`/`update`/`delete`.

---

## 2. Perubahan Content-Type: `Order`

Tambahkan satu relasi ke `src/api/order/content-types/order/schema.json` (di dalam `attributes`, sejajar dengan field `discount` yang sudah ada):

```json
"voucher": {
  "type": "relation",
  "relation": "manyToOne",
  "target": "api::voucher.voucher"
}
```

Tidak perlu `inversedBy` di sisi Voucher — relasi ini sengaja satu arah (Order tahu vouchernya, Voucher tidak perlu daftar semua Order yang memakainya; kalau butuh daftar itu, query dari sisi Order dengan filter `voucher.id`).

---

## 3. Lifecycle Hook — Validasi Otoritatif

File **baru**: `src/api/order/content-types/order/lifecycles.ts`

Ini adalah lapis validasi yang **tidak bisa dilewati** — dijalankan oleh Strapi di level Query Engine sebelum record Order benar-benar tersimpan, apa pun jalur request-nya (REST API lewat Next.js BFF, REST API langsung, atau Admin Panel).

```typescript
import { errors } from "@strapi/utils";

const { ApplicationError } = errors;

export default {
  async beforeCreate(event) {
    const { data } = event.params;

    if (!data.voucher) return; // order tanpa voucher, tidak ada yang perlu divalidasi

    const voucherId = extractRelationId(data.voucher);
    const voucher = await strapi.db.query("api::voucher.voucher").findOne({
      where: { id: voucherId },
    });

    if (!voucher) {
      throw new ApplicationError("Voucher tidak ditemukan");
    }
    if (!voucher.isActive) {
      throw new ApplicationError("Voucher tidak aktif");
    }

    const now = new Date();
    if (voucher.startDate && now < new Date(voucher.startDate)) {
      throw new ApplicationError("Voucher belum berlaku");
    }
    if (voucher.endDate && now > new Date(voucher.endDate)) {
      throw new ApplicationError("Voucher sudah kadaluarsa");
    }

    const subtotal = Number(data.subtotal ?? 0);
    if (voucher.minPurchase && subtotal < voucher.minPurchase) {
      throw new ApplicationError(
        `Minimal belanja Rp${voucher.minPurchase} untuk memakai voucher ini`
      );
    }

    if (voucher.usageLimit != null) {
      const totalUsage = await strapi.db.query("api::order.order").count({
        where: { voucher: voucherId },
      });
      if (totalUsage >= voucher.usageLimit) {
        throw new ApplicationError("Kuota voucher sudah habis");
      }
    }

    const userId = extractRelationId(data.user);
    if (voucher.usageLimitPerUser != null && userId) {
      const userUsage = await strapi.db.query("api::order.order").count({
        where: { voucher: voucherId, user: userId },
      });
      if (userUsage >= voucher.usageLimitPerUser) {
        throw new ApplicationError("Voucher ini sudah pernah kamu pakai");
      }
    }

    // Hitung ulang diskon di server — nilai `data.discount` dari client DIABAIKAN & DITIMPA.
    let discount =
      voucher.discountType === "percentage"
        ? subtotal * (Number(voucher.discountValue) / 100)
        : Number(voucher.discountValue);

    if (voucher.discountType === "percentage" && voucher.maxDiscountAmount) {
      discount = Math.min(discount, Number(voucher.maxDiscountAmount));
    }
    discount = Math.min(discount, subtotal); // jangan sampai lebih besar dari subtotal

    data.discount = Math.round(discount);
  },
};

// Relasi di `event.params.data` bisa berupa id mentah, atau object connect
// (mis. { connect: [{ id: 5 }] } atau { set: [5] }) tergantung bagaimana
// request dikirim. Helper ini menangani kedua bentuk paling umum.
function extractRelationId(relation: unknown): number | string | undefined {
  if (relation == null) return undefined;
  if (typeof relation === "number" || typeof relation === "string") return relation;
  if (typeof relation === "object") {
    const r = relation as Record<string, unknown>;
    if (Array.isArray(r.connect) && r.connect[0]) {
      const first = r.connect[0] as Record<string, unknown>;
      return (first.id ?? first.documentId) as number | string;
    }
    if (Array.isArray(r.set) && r.set[0] !== undefined) {
      return r.set[0] as number | string;
    }
  }
  return undefined;
}
```

### ⚠️ WAJIB diverifikasi sebelum dianggap selesai

Kode di atas adalah **pseudocode berbasis konsep lifecycle hook Strapi v5** (Query Engine `beforeCreate`), bukan hasil uji coba langsung terhadap versi Strapi5 yang sebenarnya dipakai di project ini — karena kode backend Strapi tidak tersedia di repo `next-commerce-temp` untuk dicek. Sebelum menganggap task ini selesai, agent BE **wajib**:

1. Cek versi Strapi5 yang dipakai (`package.json` di repo Strapi) dan baca dokumentasi lifecycle hooks resminya untuk versi tersebut — API `beforeCreate`/`event.params.data` sudah stabil sejak v4, tapi representasi payload relasi (`data.voucher`, `data.user`) bisa berbeda tergantung apakah dikirim sebagai `id`, `documentId`, atau object `{ connect: [...] }`, tergantung dari mana request datang (REST Content API vs Document Service internal).
2. Tulis test/percobaan manual (curl/Postman) yang benar-benar mengirim `POST /api/orders` dengan field `voucher` seperti yang dikirim Next.js BFF (`data.voucher = "<documentId>"`), lalu `console.log(JSON.stringify(data.voucher))` di dalam hook untuk mengonfirmasi bentuk aktualnya — sesuaikan `extractRelationId()` kalau perlu.
3. Konfirmasi `strapi.db.query(...).count()` tersedia di versi Strapi5 yang dipakai (API Query Engine ini sudah ada sejak Strapi v4 dan seharusnya tetap ada di v5, tapi tetap perlu dicek terhadap dependency yang ter-install).

---

## 4. Skenario yang Harus Diuji Manual (checklist QA)

Karena tidak diketahui konvensi testing otomatis di repo Strapi ini, verifikasi berikut disarankan lewat REST client (Postman/curl/Strapi Admin) sebelum serah terima ke tim Next.js:

- [ ] Buat voucher `discountType: fixed`, `discountValue: 20000`, `minPurchase: 100000`, `usageLimit: 2`, `usageLimitPerUser: 1` lewat Admin Panel.
- [ ] `POST /orders` dengan `subtotal: 150000` + voucher di atas → `discount` tersimpan `20000`, order berhasil dibuat.
- [ ] `POST /orders` dengan `subtotal: 50000` (di bawah minPurchase) + voucher yang sama → ditolak 400, pesan minimal belanja.
- [ ] Buat 2 order sukses dengan voucher yang sama (dari 2 user berbeda) → order ke-3 (user ke-3) ditolak 400, "Kuota voucher sudah habis".
- [ ] User yang sama coba pakai voucher `usageLimitPerUser: 1` dua kali → percobaan kedua ditolak 400.
- [ ] Voucher dengan `isActive: false` → semua order yang mencoba memakainya ditolak.
- [ ] Voucher `discountType: percentage`, `discountValue: 50`, `maxDiscountAmount: 30000`, dipakai di order `subtotal: 200000` → `discount` tersimpan `30000` (bukan `100000`), membuktikan cap berfungsi.
- [ ] Kirim `POST /orders` dengan `discount: 999999` secara manual (menyamar sebagai client nakal) + voucher valid → pastikan `discount` yang tersimpan tetap hasil hitungan server, **bukan** `999999`.
- [ ] Public role: `GET /vouchers?filters[code][$eqi]=<kode>` tanpa header `Authorization` → berhasil (200), bukan 403.

---

## 5. File Checklist (repo Strapi)

```
src/api/voucher/
  content-types/voucher/schema.json     # BARU
  controllers/voucher.ts                # BARU — default generated (strapi generate)
  routes/voucher.ts                     # BARU — default generated
  services/voucher.ts                   # BARU — default generated

src/api/order/
  content-types/order/schema.json       # UBAH — tambah relasi `voucher`
  content-types/order/lifecycles.ts     # BARU — beforeCreate hook (§3)
```

Plus konfigurasi manual di Admin Panel: Settings → Users & Permissions → Roles → Public → aktifkan `voucher.find` & `voucher.findOne` (§1).
