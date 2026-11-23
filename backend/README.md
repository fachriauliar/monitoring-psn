# Backend Monitoring PSN dan Jumantik

Backend REST API untuk sembilan halaman awal:
1. Login
2. Ubah password
3. Dashboard publik
4. Dashboard Admin Kelurahan
5. Dashboard Kasie Kesra
6. Profil Saya
7. Data Pengguna
8. Tambah Pengguna
9. Edit Pengguna

Teknologi: Node.js, Express, PostgreSQL, JWT, bcrypt, Joi.

## Persyaratan
- Node.js 18 atau lebih baru
- PostgreSQL (contoh konfigurasi menggunakan PostgreSQL lokal)
- npm

## 1. Instalasi
Buka terminal pada folder `backend`:

```bash
npm install
```

Salin `.env.example` menjadi `.env`, lalu sesuaikan konfigurasi PostgreSQL dan JWT.

Buat database PostgreSQL terlebih dahulu, misalnya:

```sql
CREATE DATABASE monitoring_psn;
```

## 2. Buat struktur tabel
```bash
npm run db:init
```

Script ini membuat tabel awal `pengguna`, `wilayah_rw`, `wilayah_rt`,
`kader_jumantik`, dan `laporan_pemeriksaan` bila belum tersedia.

## 3. Buat akun Kasie pertama
Atur `INITIAL_KASIE_NAME`, `INITIAL_KASIE_EMAIL`, dan `INITIAL_KASIE_PASSWORD`
di `.env`, kemudian jalankan:

```bash
npm run seed:kasie
```

Akun awal dibuat dengan `wajib_ubah_password = true`. Setelah login pertama,
pengguna harus diarahkan ke halaman ubah password. Jangan membagikan file `.env`.

## 4. Jalankan server
Mode development:

```bash
npm run dev
```

Mode biasa:

```bash
npm start
```

Cek server:
`GET http://localhost:3000/api/health`

## Endpoint API

### Autentikasi
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer token)
- `PATCH /api/auth/change-password` (Bearer token)

Login body:
```json
{
  "email": "kasie@kelurahan.go.id",
  "password": "password-awal"
}
```

Login response memuat `data.user`, `data.token`, `role`, dan `wajib_ubah_password`.

Ubah password body:
```json
{
  "password_lama": "password-awal",
  "password_baru": "password-baru-aman",
  "konfirmasi_password": "password-baru-aman"
}
```

### Dashboard
- `GET /api/dashboard/public` (publik)
- `GET /api/dashboard/admin` (Bearer token role admin)
- `GET /api/dashboard/kasie` (Bearer token role kasie)

### Profil
- `GET /api/profile` (Bearer token)
- `PUT /api/profile` (Bearer token)

### Pengguna (khusus Kasie)
- `GET /api/pengguna?search=&role=&status=&page=1&limit=20`
- `GET /api/pengguna/:id`
- `POST /api/pengguna`
- `PUT /api/pengguna/:id`
- `PATCH /api/pengguna/:id/status`
- `DELETE /api/pengguna/:id`

Contoh tambah pengguna:
```json
{
  "nama_lengkap": "Nama Admin",
  "nip": "",
  "email": "admin@kelurahan.go.id",
  "no_hp": "081234567890",
  "jabatan": "Admin Kelurahan",
  "bagian": "Kesejahteraan Rakyat",
  "pangkat_golongan": "",
  "role": "admin",
  "password": "password-kuat-123",
  "konfirmasi_password": "password-kuat-123"
}
```

Akun baru otomatis `wajib_ubah_password = true`.
Update pengguna tidak mengubah password; perubahan password memakai endpoint khusus.

Status akun:
- `aktif`
- `nonaktif`
- `diblokir`

## Hubungkan dengan frontend
Atur `.env` frontend:

```env
VITE_API_URL=http://localhost:3000
```

Frontend perlu menggunakan endpoint yang sama. Header endpoint terlindungi:

```http
Authorization: Bearer TOKEN
```

## Catatan data dashboard
Statistik dashboard dihitung dari tabel `wilayah_rw`, `wilayah_rt`,
`kader_jumantik`, dan `laporan_pemeriksaan`. Database baru masih kosong,
jadi angka statistik akan nol sampai data operasional diisi.

Tabel `laporan_pemeriksaan` adalah struktur awal untuk mendukung agregasi
dashboard. Bila nanti sudah ada skema Google Sheets/import yang final,
mapping sinkronisasi harus diarahkan ke tabel ini atau disesuaikan melalui
migrasi; jangan membuat salinan data pemeriksaan yang terpisah.

ABJ dihitung sebagai:
`jumlah_rumah_bebas / jumlah_rumah_diperiksa * 100`.
Data laporan yang valid dipakai untuk ringkasan publik.

## Keamanan
- Password disimpan dengan bcrypt.
- JWT secret hanya dibaca dari `.env`.
- Endpoint pengelolaan pengguna hanya dapat diakses role `superadmin`.
- Tidak ada endpoint pendaftaran publik.
- Akun superadmin aktif terakhir tidak dapat dihapus atau diturunkan rolenya.
- Logout dilakukan di frontend dengan menghapus token lokal; token JWT tetap berlaku sampai kedaluwarsa. Untuk pencabutan token lebih awal diperlukan mekanisme token revocation.
