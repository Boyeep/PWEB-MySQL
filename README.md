# PWEB-MySQL · DataRuang

Portal latihan database dari [tugas PWeb Fajar Baskoro](https://fajarbaskoro.blogspot.com/2018/04/pweb-mysql.html): CRUD pengguna RDBMS, CRUD pengguna MongoDB dengan profil fleksibel, pendaftaran siswa baru, dan spesifikasi proyek front end/back end.

- Repository: https://github.com/Boyeep/PWEB-MySQL
- Hosting: https://pweb-mysql.vercel.app
- Artikel: https://pweb-mysql.vercel.app/blog
- [HTML Blogger](docs/blogspot.html) · [Panduan Blogger](docs/BLOGSPOT.md)
- [Spesifikasi proyek](docs/SPECIFICATION.md) · [Pemetaan tugas](docs/CHECKLIST.md)

**Website dan artikel sudah dideploy. Aktivasi database online ditunda.** Seluruh CRUD sudah diuji dengan MySQL/MariaDB dan MongoDB lokal; halaman data online memerlukan koneksi database yang belum diaktifkan.

## Fitur

- `/rdbms`: tabel users dengan name, email, age; tambah, cari, urut, paginasi, detail, edit, hapus.
- `/mongodb`: data inti yang sama, ditambah profile objek JSON yang boleh mempunyai properti berbeda, array, dan objek bertingkat.
- `/siswa`: CRUD calon_siswa dengan nama, alamat, jenis kelamin, agama, dan sekolah asal.
- `/perbandingan`: perbandingan model, validasi, relasi, transaksi, dan kebutuhan penyimpanan.
- `/spesifikasi`: rencana Cakrawala PPDB mencakup tujuan, fitur, data, logika bisnis, autentikasi/security, API, rencana implementasi, dan kriteria penerimaan.
- `/api/summary`: ringkasan data ruang demo saat ini dalam JSON.

Semua data contoh fiktif. Setiap browser memperoleh ruang demo berbeda melalui cookie bertanda tangan. Ini bukan autentikasi akun petugas. Gunakan data rekaan; tidak ada seleksi atau pembayaran nyata. Hapus tidak pernah dijalankan oleh GET.

## Menjalankan lokal dengan MySQL dan MongoDB asli

Gunakan Node.js 22+, MySQL 8 atau MariaDB yang kompatibel, dan MongoDB 8.

```sh
git clone https://github.com/Boyeep/PWEB-MySQL.git
cd PWEB-MySQL
npm ci
```

1. Impor `database/mysql.sql` melalui phpMyAdmin atau MySQL CLI.
2. Salin `.env.example` menjadi `.env` dan sesuaikan port, akun, serta nama database. Port contoh 3318 adalah port pengujian; XAMPP biasa menggunakan 3306.
3. Jalankan MongoDB dan atur `MONGODB_URI`, misalnya `mongodb://127.0.0.1:27017`.
4. Isi `APP_SECRET` dengan string acak yang panjang. Untuk membuatnya: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
5. Jalankan `npm start`, lalu buka http://127.0.0.1:4190.

Tabel dibuat jika belum ada setelah koneksi berhasil, tetapi database MySQL perlu dibuat terlebih dahulu. Empat pengguna dan empat calon siswa contoh ditambahkan hanya saat ruang demo baru dibuat. Menghapus semua data tidak otomatis memuat ulang seed.

## Arsitektur dan pilihan hosting

Backend Node.js merender HTML di server. `mysql2` menjalankan query MySQL berparameter; driver resmi `mongodb` menjalankan operasi dokumen. JavaScript browser hanya membantu navigasi; seluruh CRUD tetap bekerja tanpa JavaScript.

Adapter RDBMS juga mendukung PostgreSQL melalui `SQL_DRIVER=postgres` dan `DATABASE_URL` jika hosting menyediakan RDBMS tersebut. Nama engine yang benar ditampilkan di aplikasi. Adapter ini tidak mengubah PostgreSQL menjadi MySQL. Mode lokal utama menggunakan MySQL/MariaDB.

Vercel menjalankan satu fungsi Node pada `api/index.mjs`. MySQL dan MongoDB harus berada pada layanan database jaringan yang dapat dijangkau hosting; database lokal laptop tidak otomatis tersedia di Vercel. Status koneksi yang gagal ditampilkan secara eksplisit, tanpa mengganti penyimpanan dengan data palsu.

Environment hosting: `APP_SECRET`, `SQL_DRIVER`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` atau `DATABASE_URL`, serta `MONGODB_URI` dan `MONGODB_DATABASE`. Jangan unggah `.env`, kredensial, atau `.vercel/`.

## Keamanan dan batasan

Token CSRF diperiksa pada perubahan data. Semua query dan operasi dokumen membatasi workspace. Email unik per ruang. Usia harus bilangan bulat 1–120. Teks di-escape sebelum ditampilkan. JSON profil dibatasi ukuran/kedalaman dan menolak operator serta nama properti berbahaya. Cookie HttpOnly, SameSite=Lax, dan Secure pada Vercel.

Ruang demo maksimum 100 catatan per modul. Cookie berakhir setelah tujuh hari; dokumen MongoDB menggunakan TTL. MySQL menyimpan data demo sampai dibersihkan oleh pengelola. Jangan memakai prototipe ini untuk identitas siswa nyata.

## Pengujian

`npm test` menguji HTTP dan operasi CRUD terhadap server database yang dikonfigurasi di `.env`. `npm run test:services` menjalankan MongoDB sungguhan yang bersifat sementara untuk QA pada port 27028; binary diunduh dari sumber MongoDB resmi. Ini bukan mock dan tidak dipakai di hosting.

**75 pemeriksaan HTTP/database dan 39 pemeriksaan layout/interaksi lolos.** Laporan tersedia di `qa-http.json` dan `qa-layout.json`. Pengujian memakai MySQL/MariaDB dan MongoDB asli; mencakup inisialisasi workspace bersamaan agar ringkasan tetap konsisten.

Screenshot tersedia di `screenshots/`. Font Inter lokal menggunakan lisensi OFL pada `public/assets/OFL.txt`; ikon dan ilustrasi dibuat dari SVG/CSS lokal.

Status aktivasi database online dan langkah pemilik akun dicatat pada [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
