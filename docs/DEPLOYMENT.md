# Status deployment DataRuang

Kode aplikasi, artikel, spesifikasi proyek, dan aset disiapkan untuk project Vercel **pweb-mysql**. Domain utama: https://pweb-mysql.vercel.app.

## Database lokal yang telah diuji

- MySQL/MariaDB, database pweb_mysql_lab: CRUD tabel users dan calon_siswa.
- MongoDB 8.0.17 yang dijalankan sungguhan untuk QA: CRUD collection users dengan profile fleksibel.
- 75 pemeriksaan HTTP/database dan 39 pemeriksaan layout/interaksi lolos.

## Aktivasi database online

Database lokal tidak dapat diakses langsung oleh fungsi Vercel. Akun Vercel belum memiliki instalasi marketplace database. CLI mengembalikan **integration_terms_acceptance_required** dan mewajibkan pemilik akun menyelesaikan penerimaan syarat layanan melalui browser.

Tautan yang dikembalikan langsung oleh Vercel:

1. MongoDB Atlas: https://vercel.com/boyeeps/~/integrations/accept-terms/mongodbatlas?source=cli
2. Neon: https://vercel.com/boyeeps/~/integrations/accept-terms/neon?source=cli

Hanya paket gratis yang dimaksud untuk demo ini. Tidak ada paket berbayar yang disetujui atau dibeli. Setelah persetujuan pemilik selesai, resource dapat dibuat, dihubungkan ke project, dan aplikasi perlu dideploy ulang agar environment koneksi aktif.

Pilihan Neon menyediakan **PostgreSQL sebagai RDBMS online**, dengan adapter yang sudah disiapkan. MySQL/MariaDB tetap merupakan implementasi lokal utama dan sudah diuji. Aplikasi menampilkan nama engine yang sebenarnya. Jika deployment harus memakai MySQL juga, gunakan layanan MySQL jaringan dan isikan MYSQL_HOST/PORT/DATABASE/USER/PASSWORD serta MYSQL_SSL=true sesuai penyedia.

Saat koneksi database belum tersedia, ringkasan memperlihatkan status belum terhubung dan halaman data mengembalikan pesan layanan belum tersedia. Aplikasi tidak menampilkan keberhasilan penyimpanan palsu atau mengganti MongoDB dengan file JSON.

Panduan legal resmi Vercel: https://vercel.com/kb/guide/using-coding-agents-to-procure-vercel-marketplace-integrations.
