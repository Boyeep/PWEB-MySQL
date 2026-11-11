# Spesifikasi Proyek Website: Cakrawala PPDB

Status: usulan pengembangan aplikasi sekolah dari prototipe CRUD DataRuang. Login, unggah berkas, seleksi, dan pembayaran di bawah adalah rencana; belum diaktifkan pada demo.

## 1. Nama dan deskripsi

**Cakrawala PPDB** merupakan website penerimaan peserta didik baru untuk sekolah fiktif SMK Cakrawala. Calon siswa mengisi formulir dan mengirim dokumen, sedangkan petugas memeriksa kelengkapan data, mencatat hasil verifikasi, dan menyampaikan status pendaftaran.

DataRuang menjadi prototipe pembelajaran pengelolaan data: pengguna pada RDBMS, profil fleksibel pada MongoDB, dan CRUD calon siswa. Prototipe memisahkan data per ruang demo; prototipe tidak membuat keputusan penerimaan atau memproses pembayaran nyata.

## 2. Tujuan

- Mengurangi pencatatan formulir berulang dan data yang tidak konsisten.
- Menyediakan satu sumber status pendaftaran yang dapat dilacak.
- Memisahkan peran calon siswa, verifikator, dan administrator.
- Memperlihatkan alasan pemilihan database berdasarkan hubungan dan bentuk data.

## 3. Pengguna dan hak akses yang direncanakan

| Peran | Hak akses |
|---|---|
| Calon siswa | Mengisi dan mengubah draft sendiri; mengunggah berkas; melihat status sendiri |
| Verifikator | Memeriksa berkas; meminta perbaikan; mencatat hasil verifikasi |
| Administrator | Mengelola periode, program studi, akun petugas, dan laporan |

## 4. Fitur front end

1. Beranda: profil singkat sekolah, informasi periode, persyaratan, dan alur pendaftaran.
2. Registrasi dan login: formulir akun, pemulihan akses, dan informasi kesalahan yang jelas.
3. Formulir pendaftaran: data diri, sekolah asal, pilihan program, dan ringkasan sebelum kirim.
4. Unggah dokumen: daftar persyaratan, batas ukuran, format file, dan status kelengkapan.
5. Dashboard calon siswa: nomor pendaftaran, status, catatan revisi, dan riwayat perubahan.
6. Dashboard petugas: pencarian, filter periode/status, detail pendaftar, dan pencatatan verifikasi.
7. Tampilan responsif, navigasi keyboard, label formulir, kontras teks, serta pesan proses dan hasil.

## 5. Fitur back end dan pengelolaan data

RDBMS MySQL menjadi sumber utama untuk data yang memerlukan relasi: akun, periode, program keahlian, pendaftaran, dokumen, status verifikasi, pembayaran, dan audit log. Gunakan primary key, foreign key, unique constraint, dan transaksi untuk perubahan yang saling bergantung.

MongoDB dapat dipakai untuk profil tambahan atau preferensi dengan bentuk yang berubah. Kebutuhan ini tidak mengharuskan sekolah memakai dua database; pada sistem operasional kecil, MySQL saja dapat lebih sederhana. Modul MongoDB pada DataRuang memperlihatkan pengelolaan profil fleksibel dan perbandingan model data.

Tabel yang direncanakan:

| Tabel | Kolom utama dan relasi |
|---|---|
| accounts | id, name, email unik, password_hash, role, is_active |
| admission_periods | id, name, opens_at, closes_at, status |
| programs | id, code unik, name, capacity |
| applications | id, applicant_id → accounts, period_id → admission_periods, program_id → programs, registration_number unik, status |
| applicant_profiles | application_id → applications, nama, alamat, jenis_kelamin, agama, sekolah_asal |
| documents | id, application_id → applications, document_type, storage_key, verification_status |
| status_history | id, application_id → applications, actor_id → accounts, old_status, new_status, reason, created_at |
| payments | id, application_id → applications, provider_order_id unik, amount, status, paid_at |

Pada prototipe saat ini, tabel nyata yang sudah dibuat adalah workspaces, users, dan calon_siswa. Collection MongoDB nyata adalah users dan workspaces. Tabel usulan di atas belum merupakan migrasi produksi.

## 6. Logika bisnis

- Pendaftaran hanya dapat dikirim selama periode terbuka.
- Satu akun hanya boleh memiliki satu pendaftaran aktif untuk periode yang sama.
- Draft dapat diubah calon siswa. Data terkirim hanya dapat diubah setelah petugas meminta revisi.
- Perubahan status harus mengikuti urutan yang diizinkan: draft → submitted → under_review → needs_revision atau verified. Hasil akhir diterbitkan oleh petugas berwenang.
- Kelengkapan data dan pembayaran tidak otomatis menentukan penerimaan siswa.
- Setiap perubahan status mencatat pelaku, waktu, dan alasan.
- Penghapusan draft memerlukan konfirmasi. Data yang sudah menjadi arsip mengikuti kebijakan retensi sekolah.

## 7. Autentikasi dan security

Rencana sistem akun: hashing password dengan algoritma yang sesuai, cookie sesi HttpOnly/Secure/SameSite, regenerasi sesi setelah login, kedaluwarsa sesi, otorisasi per peran, CSRF pada perubahan data, rate limit login, serta audit log tindakan petugas. Keputusan akses harus diperiksa di server pada setiap request.

Query SQL memakai parameter terpisah; filter MongoDB dibentuk server tanpa menerima operator dari input pengguna. Teks yang ditampilkan di HTML di-escape. Rahasia koneksi database dan payment gateway berada pada environment hosting.

Unggah berkas harus dibatasi ukuran/tipe, diperiksa kontennya, menggunakan nama acak, dan disimpan privat di luar folder publik. Pengunduhan memerlukan pemeriksaan hak akses. Backup dan uji pemulihan diperlukan sebelum pemakaian operasional.

Yang sudah ada di prototipe: cookie ruang demo yang ditandatangani HMAC, token CSRF, pembatasan semua query berdasarkan workspace, validasi server, query SQL berparameter, unique index email per workspace, escaping HTML, pembatasan JSON tambahan, dan konfirmasi hapus melalui POST. Cookie ruang demo bukan pengganti autentikasi akun petugas.

## 8. API dan rencana integrasi

API yang sudah tersedia pada prototipe: `GET /api/summary`, yang mengembalikan jumlah data ruang demo saat ini serta nama engine yang digunakan. Endpoint ini tidak mengembalikan kredensial atau data pengunjung lain.

API sistem operasional yang direncanakan:

| Method dan endpoint | Tujuan | Akses |
|---|---|---|
| POST /api/auth/login | Membuat sesi akun | Publik dengan rate limit |
| POST /api/applications | Membuat draft | Calon siswa |
| PATCH /api/applications/:id | Mengubah draft sendiri | Pemilik draft |
| POST /api/applications/:id/submit | Mengirim untuk diperiksa | Pemilik draft |
| POST /api/applications/:id/review | Mencatat hasil pemeriksaan | Verifikator |
| POST /api/payments/checkout | Meminta token checkout | Pemilik pendaftaran |
| POST /api/payments/webhook | Menerima notifikasi gateway | Verifikasi signature server |

Payment gateway, misalnya Midtrans, hanya direncanakan untuk sandbox terlebih dahulu. Nominal ditentukan server, bukan browser. Webhook harus diverifikasi, jumlah dan order harus cocok, serta event berulang diproses secara idempoten. Redirect sukses pada browser tidak boleh langsung mengubah status menjadi lunas. Tidak ada pembayaran nyata pada demo DataRuang.

## 9. Rencana implementasi

| Tahap | Hasil |
|---|---|
| Minggu 1 | Memastikan kebutuhan, peran, alur, wireframe, dan skema MySQL |
| Minggu 2 | Akun dan otorisasi; formulir; CRUD pendaftaran; validasi dan pencarian |
| Minggu 3 | Berkas privat; workflow verifikasi; histori dan laporan; sandbox API pembayaran jika dibutuhkan |
| Minggu 4 | Pengujian alur, akses, transaksi, backup/pemulihan, aksesibilitas, deployment, dan dokumentasi |

Urutan merupakan estimasi rencana, bukan laporan pekerjaan yang sudah dilaksanakan. Payment gateway tidak menghalangi penyelesaian MVP jika sekolah tidak memerlukan biaya pendaftaran.

## 10. Kriteria penerimaan dan batasan

- Akun tidak dapat membaca atau mengubah pendaftaran milik akun lain.
- Request tidak valid tidak mengubah database.
- Email dan nomor pendaftaran yang seharusnya unik ditolak jika berulang.
- Form tambah, detail, edit, pencarian, dan hapus bekerja pada viewport 375-1440 piksel.
- Perubahan status yang tidak sesuai ditolak server dan tidak menulis histori yang menyesatkan.
- Notifikasi pembayaran duplikat tidak menghasilkan pencatatan ganda.
- Backup diuji dapat dipulihkan sebelum sistem digunakan untuk data nyata.

Demo tidak mencakup keputusan seleksi, data identitas nyata, unggah berkas, akun petugas, notifikasi email, atau transaksi finansial. Seluruh nama dan email contoh bersifat fiktif.
