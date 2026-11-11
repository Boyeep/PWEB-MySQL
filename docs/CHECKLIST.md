# Cakupan Fitur DataRuang

| Bagian aplikasi | Implementasi |
|---|---|
| Aplikasi RDBMS dengan users: name, email, age | `/rdbms`; MySQL/MariaDB; skema pada `database/mysql.sql` |
| Aplikasi MongoDB dengan struktur lebih fleksibel | `/mongodb`; collection users dengan profile berbentuk objek/array bertingkat |
| Aplikasi pendaftaran siswa baru | `/siswa`; CRUD tabel calon_siswa, field sesuai studi kasus |
| Spesifikasi nama, deskripsi, tujuan, fitur, implementasi | `docs/SPECIFICATION.md` dan halaman `/spesifikasi` |
| Pengelolaan data, logika bisnis, autentikasi/security, API | Bagian 5-8 spesifikasi; status prototipe dan rencana dibedakan secara eksplisit |
| Blog, kode GitHub, deploy | Artikel `docs/blogspot.html`, repo Boyeep/PWEB-MySQL, dan project Vercel pweb-mysql |

Backend memakai Node.js agar dua driver database dapat digunakan pada satu aplikasi. MySQL dan MongoDB merupakan server database asli, bukan localStorage atau penyimpanan JSON yang diberi label database.
