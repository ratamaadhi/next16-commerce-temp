# Proposal Template E-Commerce

**Platform:** Next.js + Strapi 5 + Midtrans + KiriminAja
**Klien:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Tanggal:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

## Ringkasan Eksekutif

Template e-commerce siap pakai dengan CMS terpisah (Strapi 5), pembayaran via Midtrans, dan integrasi ongkos kirim real-time. Frontend menggunakan Next.js — cepat, SEO-friendly, dan mobile-responsive. Tim marketing bisa mengelola konten sendiri tanpa perlu developer.

---

## Fitur Lengkap

### 1. Katalog Produk

| Fitur | Keterangan |
|-------|------------|
| Halaman landing premium | Hero animasi, koleksi unggulan, kategori, testimoni, promo banner |
| Listing produk | Filter kategori, sortir (terbaru/termurah/termahal), pencarian teks |
| Halaman detail produk | Galeri gambar multi-angle, varian, spesifikasi, review |
| Varian produk | Ukuran/warna/dll — stok terpisah per varian |
| Badge otomatis | Diskon (%-an), kondisi barang, stok habis |
| Quick view | Lihat detail cepat via popup tanpa pindah halaman |
| SEO siap | Meta title/description per produk, URL slug rapi |

### 2. Keranjang Belanja

| Fitur | Keterangan |
|-------|------------|
| Sidebar keranjang | Muncul dari mana saja, tanpa pindah halaman |
| Sinkronasi server | Keranjang aman walau ganti perangkat/browser |
| Validasi stok | Cegah pembelian melebihi stok, proteksi overselling |
| Guest & logged-in | Belanja tanpa login tetap aman; saat login, keranjang menyatu otomatis |

### 3. Pembayaran — Midtrans

| Fitur | Keterangan |
|-------|------------|
| 20+ metode pembayaran | Transfer bank (BCA/Mandiri/BNI/BRI), kartu kredit, GoPay, OVO, DANA, ShopeePay, LinkAja, QRIS, Indomaret, Alfamart |
| Popup embed | Pembayaran di dalam website — tidak perlu redirect ke halaman lain |
| Auto-pay | Pelanggan langsung ke pembayaran setelah checkout |
| Cek status real-time | Polling otomatis tahu pembayaran lunas/gagal/pending |
| Retry gagal bayar | Jika pembayaran gagal bisa bayar ulang dengan token baru |

### 4. Ongkos Kirim — KiriminAja

| Fitur | Keterangan |
|-------|------------|
| Pencarian alamat | Autocomplete kecamatan, tinggal ketik nama |
| Ongkir real-time | Cek tarif langsung dari JNE, J&T, Sicepat, AnterAja, Ninja Xpress, Lion Parcel, dll |
| Grup layanan | Ekonomi, Reguler, Ekspres, Instant, Kargo — plus badge COD |
| Estimasi sampai | Lihat perkiraan hari (ETD) langsung dari kurir |

### 5. Manajemen Pesanan

| Fitur | Keterangan |
|-------|------------|
| Riwayat pesanan | Filter status (Pending/Diproses/Dikirim/Selesai/Dibatalkan) |
| Detail pesanan | Timeline progress, daftar item, ringkasan biaya, info pengiriman |
| Timeline visual | Progress bar + badge warna — status jelas dalam sekali lihat |
| Cari berdasarkan nomor | Cari pesanan cepat dengan nomor order |

### 6. Akun Pelanggan

| Fitur | Keterangan |
|-------|------------|
| Registrasi & login | Form dengan validasi, proteksi password |
| Konfirmasi email | Verifikasi alamat email sebelum transaksi |
| Halaman akun | Profil, link ke riwayat pesanan, logout |

### 7. Tampilan & Antarmuka

| Fitur | Keterangan |
|-------|------------|
| Desain branded | Dark mode, tipografi Playfair + Inter, palet warna hangat |
| Animasi halus | Hero animasi (GSAP), scroll reveal, efek hover |
| Responsive | Desktop, tablet, mobile — tampil rapi di semua layar |
| Notifikasi | Toast sukses/gagal/info — non-intrusif |

### 8. CMS — Strapi 5

| Fitur | Keterangan |
|-------|------------|
| Dashboard admin | Tim marketing kelola konten sendiri — tanpa coding |
| Produk & kategori | CRUD produk, kategori, varian, gambar |
| Landing page | Atur konten landing page dari CMS |
| Role user | Multi-level akses (admin, editor, dll) |

---

## Yang Perlu Disiapkan Klien

| Kebutuhan | Keterangan |
|-----------|------------|
| Domain | Nama domain toko (contoh: cyra.com) |
| Server/VPS | Deployment Docker, minimal 2GB RAM |
| Akun Midtrans | Daftar di Midtrans (gratis) — untuk menerima pembayaran |
| Akun KiriminAja | Daftar di KiriminAja — untuk ongkos kirim |
| Konten produk | Foto, deskripsi, harga, varian — diisi via CMS Strapi |
| Brand assets | Logo, warna brand, tone of voice |

---

## Estimasi Biaya Pihak Ketiga

| Item | Perkiraan Biaya |
|------|-----------------|
| Server VPS | ~Rp150–300rb/bulan |
| Domain | ~Rp150–300rb/tahun |
| Midtrans | Gratis daftar, fee per transaksi (~2-3%) |
| KiriminAja | Gratis daftar, fee per pengiriman |
| SSL | Gratis (Let's Encrypt via reverse proxy) |

---

## Keunggulan Template Ini

1. **CMS terpisah** — Tim marketing bisa edit produk/konten tanpa bantuan developer
2. **Pembayaran lengkap** — 20+ metode bayar via Midtrans, embed popup di website
3. **Ongkir real-time** — Pelanggan lihat tarif pesanan mereka langsung dari kurir
4. **Fast & SEO-friendly** — Next.js dengan server rendering, loading cepat
5. **Docker ready** — Deploy mudah di VPS mana pun
6. **Mobile responsive** — Tampil optimal di desktop, tablet, dan HP
7. **Bahasa Indonesia penuh** — Semua antarmuka dan notifikasi bahasa Indonesia
8. **Source code lengkap** — Bisa dikustomisasi sesuai kebutuhan

---

**Kontak:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**Email:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
**WhatsApp:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
