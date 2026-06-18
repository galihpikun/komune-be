# Komune BE

Backend API untuk aplikasi forum diskusi dan pelaporan sosial media.

## Deskripsi

Komune BE adalah backend Node.js untuk platform komunitas yang menyediakan fitur:

- otentikasi pengguna (register, login, logout)
- manajemen postingan dengan upload gambar
- komentar dan balasan komentar
- notifikasi untuk aktivitas pengguna
- reaksi postingan (like/dislike)
- laporan konten dan review laporan
- dashboard statistik untuk admin
- filter dan moderasi postingan

## Teknologi dan Paket Utama

- Node.js
- Express.js
- MySQL (mysql2)
- JWT untuk otentikasi (`jsonwebtoken`)
- Bcrypt untuk hashing password (`bcrypt`)
- Multer untuk upload file (`multer`)
- CORS (`cors`)
- dotenv untuk environment variables (`dotenv`)
- Cookie Parser (`cookie-parser`)
- Nodemon untuk pengembangan (`nodemon`)
- Slugify (`slugify`)

## Struktur Proyek

- `index.js` - entry point aplikasi Express
- `package.json` - daftar dependensi dan skrip
- `src/lib/db.js` - koneksi database MySQL
- `src/controllers/` - logic endpoint untuk fitur
- `src/routes/` - definisi route API
- `src/middlewares/` - middleware JWT dan upload file
- `src/service/` - servis notifikasi
- `src/utils/` - helper untuk generate token
- `uploads/` - direktori penyimpanan file gambar
- `public/uploads/` - asset file statis

## Fitur Utama

- register/login/logout
- session JWT di header Authorization
- route user profile dan admin management
- upload avatar dan upload postingan gambar
- CRUD postingan
- moderasi postingan oleh admin
- komentar, pembaruan, hapus komentar
- notifikasi user untuk like, komentar, dan balasan
- report postingan oleh user dan review report oleh admin
- statistik dashboard

## API Endpoints

Base URL: `http://localhost:3000`

### Auth

- `POST /api/auth/register` - daftar baru
- `POST /api/auth/login` - login
- `DELETE /api/auth/log-out` - logout

### Users

- `GET /api/users/get-users` - ambil semua user (super admin saja)
- `POST /api/users/admin-create` - buat user admin (super admin saja)
- `GET /api/users/get-avatar` - ambil avatar user login
- `GET /api/users/get-me` - ambil data user login
- `DELETE /api/users/side/delete` - hapus akun sendiri
- `PUT /api/users/side/update` - update profil sendiri
- `PUT /api/users/upload-avatar` - upload avatar user
- `GET /api/users/:id` - ambil data user by id
- `PUT /api/users/admin/:id` - update user oleh super admin
- `DELETE /api/users/admin/:id` - hapus user oleh super admin

### Posts

Semua route posts membutuhkan header `Authorization: Bearer <token>`.

- `GET /api/posts` - daftar post dengan status approved
- `GET /api/posts/moderation` - daftar post untuk moderasi
- `GET /api/posts/trending` - post trending berdasarkan like
- `GET /api/posts/user-posts` - post milik user login
- `GET /api/posts/:id` - detail post
- `POST /api/posts` - buat post baru dengan upload gambar
- `PATCH /api/posts/:id` - update post
- `PATCH /api/posts/approve/:id` - approve post
- `PATCH /api/posts/reject/:id` - reject post
- `DELETE /api/posts/:id` - hapus post

### Comments

Semua route comments membutuhkan `Authorization`.

- `GET /api/comments/post/:postId` - daftar komentar berdasarkan post
- `POST /api/comments` - buat komentar atau reply
- `PATCH /api/comments/:id` - update komentar
- `DELETE /api/comments/:id` - hapus komentar

### Notifications

Semua route notifications membutuhkan `Authorization`.

- `GET /api/notifications` - ambil notifikasi user
- `DELETE /api/notifications/clear-all` - hapus semua notifikasi
- `DELETE /api/notifications/:id` - hapus notifikasi tertentu

### Post Reactions

- `POST /api/post-reactions/:postId` - like/dislike post
- `GET /api/post-reactions/:postId` - ambil jumlah like/dislike

### Reports

Semua route report membutuhkan `Authorization`.

- `GET /api/reports` - ambil semua report (admin)
- `POST /api/reports` - buat report konten
- `PATCH /api/reports/review/:id` - tandai report reviewed (admin)
- `PATCH /api/reports/resolve/:id` - resolve report / reject post (admin)
- `DELETE /api/reports/:id` - hapus report (admin)

### Dashboard

- `GET /api/statistics/dashboard` - ambil statistik dashboard

## Upload File

- Avatar disimpan di `uploads/users`
- Post image disimpan di `uploads/posts`
- File di-serve statis lewat route `/uploads`

## Setup

1. Clone repository
2. Jalankan `npm install`
3. Pastikan MySQL berjalan dan database tersedia
4. Buat tabel sesuai struktur aplikasi (misalnya `users`, `posts`, `comments`, `notifications`, `post_reactions`, `post_images`, `reports`)
5. Jalankan aplikasi
   - `npm run dev` untuk pengembangan
   - `npm start` untuk produksi

## Environment Variables

File `.env` saat ini berisi:

```env
JWT_SECRET="supersikritkey"
JWT_EXPIRES_IN="7d"
```

> Catatan: Koneksi database diatur di `src/lib/db.js` dengan nilai default:
> `host: 'localhost'`, `user: 'root'`, `database: 'db_komune'`.
> Jika perlu, sesuaikan file tersebut untuk environment Anda.

## Menjalankan Project

- `npm install`
- `npm run dev`
- Buka `http://localhost:3000`
- API root: `GET /` untuk memeriksa API berjalan

## Tips

- Gunakan header `Authorization: Bearer <token>` pada request yang membutuhkan otentikasi
- Pastikan folder `uploads/posts` dan `uploads/users` dapat ditulis oleh aplikasi
- Pastikan JWT secret di `.env` kuat dan tidak dibagikan
