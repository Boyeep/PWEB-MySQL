import { sqlLabel } from "./sql-store.mjs";
import { genders, religions } from "./data.mjs";

export const e = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
export function icon(name) {
  const paths = {
    database:
      '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 4 16 4 16 0V5M4 12v7c0 4 16 4 16 0v-7"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    users:
      '<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2m6 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    leaf: '<path d="M12 22V10m0 8C1 13 7 4 12 2c5 2 11 11 0 16Z"/>',
    book: '<path d="M12 7C8 4 4 4 2 5v15c3-1 6-1 10 2 4-3 7-3 10-2V5c-2-1-6-1-10 2Zm0 0v15"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6M8 13h8m-8 4h5"/>',
    compare: '<path d="M3 7h16m-4-4 4 4-4 4M21 17H5m4-4-4 4 4 4"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    edit: '<path d="m16 3 5 5-13 13H3v-5L16 3Zm-3 3 5 5"/>',
    trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    code: '<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18"/>',
  };
  return `<svg class="icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.file}</svg>`;
}

const labels = {
  rdbms: "Pengguna RDBMS",
  mongodb: "Pengguna MongoDB",
  siswa: "Pendaftaran siswa",
};
export function layout(ctx, title, active, content) {
  const links = [
    ["home", "/", "grid", "Ringkasan"],
    ["rdbms", "/rdbms", "database", "Pengguna RDBMS"],
    ["mongodb", "/mongodb", "leaf", "Pengguna MongoDB"],
    ["siswa", "/siswa", "users", "Pendaftaran siswa"],
    ["compare", "/perbandingan", "compare", "Bandingkan database"],
    ["spec", "/spesifikasi", "file", "Spesifikasi proyek"],
    ["blog", "/blog", "book", "Catatan blog"],
  ];
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="DataRuang: latihan CRUD pengguna RDBMS dan MongoDB, pendaftaran siswa, serta perencanaan proyek web."><title>${e(title)} - DataRuang</title><link rel="icon" href="/assets/favicon.svg"><link rel="preload" as="font" type="font/woff2" href="/assets/inter-latin.woff2" crossorigin><link rel="stylesheet" href="/assets/style.css"><script src="/assets/app.js" defer></script></head><body><a class="skip" href="#main">Lewati navigasi</a><aside class="sidebar" id="sidebar"><a class="brand" href="/"><span class="brand-mark">${icon("database")}</span>data<span>ruang</span><b>.</b></a><div class="workspace"><span class="workspace-avatar">DR</span><div><strong>Ruang belajar</strong><small>Database &amp; web development</small></div><span class="workspace-dot"></span></div><p class="nav-label">WORKSPACE</p><nav aria-label="Navigasi utama">${links.map(([key, url, symbol, text]) => `<a class="nav-link ${key === active ? "active" : ""}" href="${url}" ${key === active ? 'aria-current="page"' : ""}>${icon(symbol)}${text}${key === active ? '<span class="active-mark"></span>' : ""}</a>`).join("")}</nav><div class="sidebar-help"><span class="square-icon">${icon("code")}</span><h3>Kenali cara data bekerja.</h3><p>Mulai dari tabel sederhana, lalu jelajahi dokumen yang lebih fleksibel.</p><a href="/perbandingan">Lihat perbandingan ${icon("arrow")}</a></div><div class="sidebar-bottom"><span class="workspace-dot"></span> Ruang demo pribadi</div></aside><div class="shell"><header class="topbar"><div class="breadcrumb"><button class="icon-button menu-toggle" aria-label="Buka navigasi" aria-expanded="false" aria-controls="sidebar">${icon("menu")}</button><span>Workspace</span><span class="slash">/</span><strong>${e(title)}</strong></div><div class="topbar-actions"><span class="demo-tag">DEMO</span><span class="topbar-avatar">BS</span><span>Penjelajah data</span></div></header><main id="main">${ctx.flash ? `<div class="notice" role="status">${icon("check")}${e(ctx.flash)}</div>` : ""}${content}</main><footer><span>© ${new Date().getFullYear()} DataRuang</span><span>Semua contoh fiktif. Gunakan data rekaan.</span><a href="https://github.com/Boyeep/PWEB-MySQL" target="_blank" rel="noopener noreferrer">Lihat source code ${icon("arrow")}</a></footer></div></body></html>`;
}

export function heading(eyebrow, title, description, action = "") {
  return `<div class="page-heading"><div><p class="eyebrow">${e(eyebrow)}</p><h1>${e(title)}</h1><p class="page-description">${e(description)}</p></div>${action}</div>`;
}
const engineBadge = (kind) =>
  `<span class="engine-badge ${kind === "mongodb" ? "mongo" : ""}">${icon(kind === "mongodb" ? "leaf" : "database")}${kind === "mongodb" ? "MongoDB" : e(sqlLabel)}</span>`;
const date = (value) =>
  new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });

export function overview(ctx, stats) {
  const sqlReady = stats.rdbms !== null,
    mongoReady = stats.mongodb !== null;
  return layout(
    ctx,
    "Ringkasan",
    "home",
    heading(
      "LAB BASIS DATA",
      "Satu data. Dua cara menyimpan.",
      "Kelola pengguna, kenali model database, dan praktikkan CRUD dalam satu ruang.",
    ) +
      `
  <section class="intro-band"><div><span class="intro-label">BELAJAR LEWAT PRAKTIK</span><h2>Bangun pemahaman.<br>Mulai dari datanya.</h2><p>Tabel dengan struktur yang jelas, atau dokumen yang tumbuh bersama kebutuhan. Pilih ruang latihan Anda.</p><a href="/perbandingan">Temukan perbedaannya ${icon("arrow")}</a></div><div class="data-visual" aria-hidden="true"><div class="mini-table"><div class="mini-header"><span></span>users <b>TABLE</b></div><div class="mini-row"><i>01</i><span>Alya</span><small>21</small></div><div class="mini-row"><i>02</i><span>Bima</span><small>22</small></div><div class="mini-row"><i>03</i><span>Citra</span><small>20</small></div></div><div class="mini-json"><span>{</span><p>"name": <b>"Alya"</b>,<br>"interests": [<b>"Desain"</b>],<br>"profile": { <b>...</b> }</p><span>}</span></div><span class="visual-connector">${icon("compare")}</span></div></section>
  <section class="stat-grid" aria-label="Ringkasan data"><article><span class="stat-icon">${icon("database")}</span><div><p>Pengguna RDBMS</p><strong>${sqlReady ? stats.rdbms : "-"}</strong><small>${sqlReady ? "Data terstruktur di ruang Anda" : "Koneksi belum tersedia"}</small></div></article><article><span class="stat-icon mint">${icon("leaf")}</span><div><p>Pengguna MongoDB</p><strong>${mongoReady ? stats.mongodb : "-"}</strong><small>${mongoReady ? "Dokumen di ruang Anda" : "Koneksi belum tersedia"}</small></div></article><article><span class="stat-icon peach">${icon("users")}</span><div><p>Pendaftar siswa</p><strong>${stats.siswa ?? "-"}</strong><small>Studi kasus CRUD sekolah</small></div></article></section>
  <div class="section-heading"><div><h2>Pilih ruang latihan</h2><p>Dua model penyimpanan, kebutuhan yang berbeda.</p></div><span class="quiet-tag">01 - 02</span></div>
  <section class="database-grid"><a class="database-card" href="/rdbms"><div class="db-card-top"><span class="large-symbol">${icon("database")}</span><span class="connection"><i class="${sqlReady ? "connected" : ""}"></i>${sqlReady ? "Terhubung" : "Belum terhubung"}</span></div><p class="eyebrow">RELATIONAL DATABASE</p><h2>Struktur yang konsisten.</h2><p>Nama, email, dan usia tersimpan dalam tabel dengan tipe data dan aturan yang jelas.</p><div class="code-pills"><code>name</code><code>email</code><code>age</code></div><div class="db-card-foot"><span>Buka pengguna RDBMS</span>${icon("arrow")}</div></a><a class="database-card mongo-card" href="/mongodb"><div class="db-card-top"><span class="large-symbol mint">${icon("leaf")}</span><span class="connection"><i class="${mongoReady ? "connected" : ""}"></i>${mongoReady ? "Terhubung" : "Belum terhubung"}</span></div><p class="eyebrow">DOCUMENT DATABASE</p><h2>Ruang untuk lebih fleksibel.</h2><p>Tambahkan minat, kota, atau profil bertingkat tanpa menambahkan kolom pada tabel.</p><div class="code-pills"><code>profile { }</code><code>interests [ ]</code></div><div class="db-card-foot"><span>Buka pengguna MongoDB</span>${icon("arrow")}</div></a></section>
  <section class="school-banner"><span class="school-icon">${icon("book")}</span><div><p class="eyebrow">STUDI KASUS</p><h2>Pendaftaran siswa baru</h2><p>Terapkan operasi Create, Read, Update, dan Delete pada data calon siswa.</p></div><a class="button secondary" href="/siswa">Kelola pendaftar ${icon("arrow")}</a></section>`,
  );
}

export function directory(ctx, kind, rows) {
  const student = kind === "siswa",
    mongo = kind === "mongodb";
  const q = (ctx.url.searchParams.get("q") || "").slice(0, 100);
  const sort = ctx.url.searchParams.get("sort") || "newest";
  if (sort === "name")
    rows.sort((a, b) =>
      (a.name || a.nama).localeCompare(b.name || b.nama, "id"),
    );
  const total = rows.length,
    pages = Math.max(1, Math.ceil(total / 8));
  const page = Math.max(
    1,
    Math.min(pages, Number.parseInt(ctx.url.searchParams.get("page"), 10) || 1),
  );
  const visible = rows.slice((page - 1) * 8, page * 8);
  const title = labels[kind];
  const subtitle = student
    ? "Catat pendaftaran dan kelola informasi calon siswa."
    : mongo
      ? "Data inti yang sama, dengan profil tambahan yang dapat berbeda."
      : "Kelola nama, email, dan usia dengan struktur tabel yang konsisten.";
  return layout(
    ctx,
    title,
    kind,
    heading(
      student
        ? "STUDI KASUS CRUD"
        : mongo
          ? "DOCUMENT DATABASE"
          : "RELATIONAL DATABASE",
      title,
      subtitle,
      `<a class="button primary" href="/${kind}/new">${icon("plus")}${student ? "Tambah pendaftar" : "Tambah pengguna"}</a>`,
    ) +
      `
  <section class="panel"><div class="panel-header"><div><h2>${student ? "Daftar calon siswa" : "Direktori pengguna"} <span class="count">${total}</span></h2><p>${student ? "SMK Cakrawala · Data ilustrasi" : "Data hanya tersedia di ruang demo Anda."}</p></div>${engineBadge(kind)}</div><form action="/${kind}" method="get" class="filter-bar"><div class="search-field">${icon("search")}<label class="sr-only" for="q">Cari ${student ? "nama atau sekolah" : "nama atau email"}</label><input id="q" name="q" type="search" placeholder="Cari ${student ? "nama atau sekolah asal" : "nama atau email"}..." maxlength="100" value="${e(q)}"></div><label class="sr-only" for="sort">Urutkan data</label><select id="sort" name="sort"><option value="newest" ${sort === "newest" ? "selected" : ""}>Terbaru</option><option value="name" ${sort === "name" ? "selected" : ""}>Nama A-Z</option></select><button class="button secondary" type="submit">Terapkan</button>${q ? `<a class="reset-link" href="/${kind}">Reset</a>` : ""}</form>
  <div class="table-scroll" tabindex="0" role="region" aria-label="Tabel ${e(title)}"><table><thead><tr><th scope="col">${student ? "CALON SISWA" : "PENGGUNA"}</th><th scope="col">${student ? "SEKOLAH ASAL" : "USIA"}</th><th scope="col">${student ? "JENIS KELAMIN" : mongo ? "PROFIL TAMBAHAN" : "MODEL DATA"}</th><th scope="col">DITAMBAHKAN</th><th scope="col" class="right">TINDAKAN</th></tr></thead><tbody>${visible.map((row, index) => `<tr><td><div class="person-cell"><span class="person-avatar tone-${index % 4}">${e((row.name || row.nama).slice(0, 1).toUpperCase())}</span><div><a class="person-name" href="/${kind}/detail?id=${e(row.id)}">${e(row.name || row.nama)}</a><small>${e(student ? row.alamat : row.email)}</small></div></div></td><td>${student ? e(row.sekolah_asal) : `${row.age} tahun`}</td><td>${student ? e(row.jenis_kelamin) : `<span class="model-pill ${mongo ? "mint-pill" : ""}">${mongo ? `${Object.keys(row.profile || {}).length} properti` : "Tabel users"}</span>`}</td><td class="table-date">${e(date(row.created_at))}</td><td><div class="row-actions"><a class="icon-button" href="/${kind}/edit?id=${e(row.id)}" aria-label="Edit ${e(row.name || row.nama)}" title="Edit">${icon("edit")}</a><a class="icon-button danger" href="/${kind}/delete?id=${e(row.id)}" aria-label="Hapus ${e(row.name || row.nama)}" title="Hapus">${icon("trash")}</a></div></td></tr>`).join("") || `<tr><td colspan="5"><div class="empty-state">${icon("search")}<h3>Tidak ada data yang sesuai.</h3><p>Coba kata kunci lain atau tambahkan data baru.</p><a href="/${kind}">Tampilkan semua data</a></div></td></tr>`}</tbody></table></div><div class="pagination"><span>Menampilkan ${total ? (page - 1) * 8 + 1 : 0}-${Math.min(page * 8, total)} dari ${total} data</span><nav aria-label="Halaman direktori">${Array.from({ length: pages }, (_, i) => `<a class="page-number ${page === i + 1 ? "current" : ""}" href="/${kind}?${e(new URLSearchParams({ q, sort, page: String(i + 1) }))}" ${page === i + 1 ? 'aria-current="page"' : ""}>${i + 1}</a>`).join("")}</nav></div></section><div class="below-note">${icon("file")}<p>${student ? "Klik nama siswa untuk membuka detail pendaftaran." : mongo ? "Buka detail pengguna untuk melihat dokumen JSON dan isi profil." : "Email harus unik di dalam ruang demo yang sama. Usia berupa bilangan bulat."}</p></div>`,
  );
}

export function formPage(ctx, kind, values = {}, errors = {}, editing = false) {
  const mongo = kind === "mongodb",
    student = kind === "siswa";
  const title = editing
    ? "Edit " + (student ? "pendaftar" : "pengguna")
    : "Tambah " + (student ? "pendaftar" : "pengguna");
  const field = (name, label, type = "text", options = {}) =>
    `<div class="field ${options.full ? "full" : ""}"><label for="${name}">${label} ${options.optional ? '<span class="optional">Opsional</span>' : '<span class="required">*</span>'}</label>${type === "select" ? `<select id="${name}" name="${name}" required ${errors[name] ? 'aria-invalid="true" aria-describedby="error-' + name + '"' : ""}><option value="">${options.placeholder || "Pilih salah satu"}</option>${options.choices.map((option) => `<option ${values[name] === option ? "selected" : ""}>${e(option)}</option>`).join("")}</select>` : type === "textarea" ? `<textarea id="${name}" name="${name}" rows="${options.rows || 3}" ${options.optional ? "" : "required"} maxlength="${options.max || 255}" placeholder="${e(options.placeholder || "")}" ${errors[name] ? 'aria-invalid="true" aria-describedby="error-' + name + '"' : ""}>${e(values[name] || "")}</textarea>` : `<input id="${name}" name="${name}" type="${type}" value="${e(values[name] ?? "")}" ${options.optional ? "" : "required"} ${options.min !== undefined ? 'min="' + options.min + '"' : ""} ${options.max !== undefined ? (type === "number" ? "max" : "maxlength") + '="' + options.max + '"' : ""} ${options.minlength ? 'minlength="' + options.minlength + '"' : ""} placeholder="${e(options.placeholder || "")}" ${errors[name] ? 'aria-invalid="true" aria-describedby="error-' + name + '"' : ""}>`}${options.help ? `<p class="field-help">${options.help}</p>` : ""}${errors[name] ? `<p class="field-error" id="error-${name}">${e(errors[name])}</p>` : ""}</div>`;
  let fields = student
    ? field("nama", "Nama lengkap", "text", {
        full: true,
        minlength: 2,
        max: 64,
        placeholder: "Masukkan nama calon siswa",
      }) +
      field("jenis_kelamin", "Jenis kelamin", "select", { choices: genders }) +
      field("agama", "Agama / kepercayaan", "select", { choices: religions }) +
      field("alamat", "Alamat", "textarea", {
        full: true,
        max: 255,
        placeholder: "Nama jalan, nomor, dan kota",
      }) +
      field("sekolah_asal", "Sekolah asal", "text", {
        full: true,
        minlength: 2,
        max: 64,
        placeholder: "Contoh: SMP Negeri 1 Surabaya",
      })
    : field("name", "Nama lengkap", "text", {
        full: true,
        minlength: 2,
        max: 100,
        placeholder: "Masukkan nama pengguna",
      }) +
      field("email", "Email", "email", {
        max: 254,
        placeholder: "nama@example.com",
      }) +
      field("age", "Usia", "number", {
        min: 1,
        max: 120,
        placeholder: "Contoh: 21",
        help: "Bilangan bulat antara 1-120 tahun.",
      });
  if (mongo)
    fields += field("profile", "Profil tambahan (JSON)", "textarea", {
      full: true,
      optional: true,
      max: 4000,
      rows: 9,
      placeholder: '{"city":"Surabaya","interests":["Desain"]}',
      help: "Objek JSON. Properti, array, dan objek bertingkat dapat berbeda pada setiap pengguna.",
    });
  return layout(
    ctx,
    title,
    kind,
    `<a class="back-link" href="/${kind}">← Kembali ke ${e(labels[kind].toLowerCase())}</a>` +
      heading(
        student
          ? "PENDAFTARAN SISWA"
          : mongo
            ? "DOKUMEN PENGGUNA"
            : "TABEL USERS",
        title,
        editing
          ? "Perbarui informasi, lalu simpan perubahan Anda."
          : "Lengkapi data di bawah untuk menambahkan catatan baru.",
      ) +
      `<div class="form-layout"><aside class="form-aside">${engineBadge(kind)}<h2>${student ? "Catat awal perjalanan." : mongo ? "Biarkan profil berkembang." : "Setiap kolom punya peran."}</h2><p>${student ? "Isi identitas dan sekolah asal dengan lengkap. Data disimpan pada tabel calon_siswa." : mongo ? "Nama, email, dan usia tetap divalidasi. Profil tambahan memberi ruang untuk data yang lebih beragam." : "Tabel users memiliki kolom name, email, dan age. Struktur ini konsisten untuk seluruh pengguna."}</p><div class="aside-note">${icon("file")}<strong>Gunakan data fiktif</strong><p>Ini ruang latihan pribadi, tanpa proses pendaftaran atau verifikasi identitas nyata.</p></div>${mongo ? '<pre>{\n  "city": "Surabaya",\n  "interests": ["Desain"],\n  "social": {\n    "github": "contoh"\n  }\n}</pre>' : ""}</aside><section class="panel form-panel"><div class="panel-header"><div><h2>${student ? "Informasi calon siswa" : "Informasi pengguna"}</h2><p>Isian bertanda <span class="required">*</span> wajib dilengkapi.</p></div><span class="quiet-tag">${editing ? "EDIT" : "BARU"}</span></div>${Object.keys(errors).length ? '<div class="error-summary" role="alert" tabindex="-1"><strong>Data belum tersimpan.</strong> Periksa kolom yang ditandai.</div>' : ""}<form action="/${kind}/save" method="post" class="data-form"><input type="hidden" name="csrf" value="${e(ctx.csrf)}">${editing ? `<input type="hidden" name="id" value="${e(values.id)}">` : ""}<div class="form-grid">${fields}</div><div class="form-actions"><a class="button secondary" href="/${kind}">Batal</a><button class="button primary" type="submit">${icon("check")}${editing ? "Simpan perubahan" : "Simpan " + (student ? "pendaftaran" : "pengguna")}</button></div></form></section></div>`,
  );
}

export function detailPage(ctx, kind, row) {
  const student = kind === "siswa",
    mongo = kind === "mongodb";
  const fields = student
    ? {
        nama: "Nama lengkap",
        alamat: "Alamat",
        jenis_kelamin: "Jenis kelamin",
        agama: "Agama / kepercayaan",
        sekolah_asal: "Sekolah asal",
      }
    : { name: "Nama lengkap", email: "Email", age: "Usia" };
  const document = mongo
    ? {
        _id: row.id,
        name: row.name,
        email: row.email,
        age: row.age,
        profile: row.profile,
      }
    : null;
  return layout(
    ctx,
    "Detail " + (student ? "pendaftar" : "pengguna"),
    kind,
    `<a class="back-link" href="/${kind}">← Kembali ke direktori</a>` +
      heading(
        mongo
          ? "DOKUMEN MONGODB"
          : student
            ? "DETAIL PENDAFTAR"
            : "RECORD RDBMS",
        row.name || row.nama,
        "Ditambahkan pada " + date(row.created_at) + ".",
        `<a class="button primary" href="/${kind}/edit?id=${e(row.id)}">${icon("edit")}Edit data</a>`,
      ) +
      `<div class="detail-layout"><section class="panel detail-panel"><h2>Informasi lengkap</h2><dl>${Object.entries(
        fields,
      )
        .map(
          ([key, label]) =>
            `<div><dt>${label}</dt><dd>${e(row[key])}${key === "age" ? " tahun" : ""}</dd></div>`,
        )
        .join(
          "",
        )}<div><dt>ID data</dt><dd class="record-id">${e(row.id)}</dd></div></dl></section>${mongo ? `<section class="panel document-panel"><div class="panel-header"><h2>Dokumen JSON</h2><span class="model-pill mint-pill">users</span></div><pre>${e(JSON.stringify(document, null, 2))}</pre></section>` : `<aside class="detail-note"><span class="large-symbol">${icon("database")}</span><h2>Tersimpan di ${e(sqlLabel)}.</h2><p>Data ini berada di ruang demo Anda. ID menjadi kunci unik setiap catatan.</p></aside>`}</div>`,
  );
}

export function deletePage(ctx, kind, row) {
  return layout(
    ctx,
    "Konfirmasi hapus",
    kind,
    `<a class="back-link" href="/${kind}">← Kembali ke direktori</a><section class="panel confirm-panel"><span class="delete-symbol">${icon("trash")}</span><h1>Hapus data ini?</h1><p>Catatan <strong>${e(row.name || row.nama)}</strong> akan dihapus dari ruang demo Anda. Tindakan ini tidak dapat dibatalkan.</p><form method="post" action="/${kind}/delete"><input type="hidden" name="csrf" value="${e(ctx.csrf)}"><input type="hidden" name="id" value="${e(row.id)}"><div class="confirm-actions"><a class="button secondary" href="/${kind}">Batal</a><button class="button destructive" type="submit">Ya, hapus data</button></div></form></section>`,
  );
}

export function comparison(ctx) {
  return layout(
    ctx,
    "Bandingkan database",
    "compare",
    heading(
      "MEMILIH PENYIMPANAN",
      "Mulai dari kebutuhan datanya.",
      "Model relasional dan dokumen sama-sama berguna. Pilih berdasarkan pola akses, relasi, dan konsistensi.",
    ) +
      `<section class="panel comparison-panel"><table><thead><tr><th>ASPEK</th><th>RDBMS / MYSQL</th><th>MONGODB</th></tr></thead><tbody>${[
        [
          "Model data",
          "Baris dan kolom dalam tabel",
          "Dokumen BSON dalam collection",
        ],
        [
          "Struktur",
          "Kolom dan tipe data ditetapkan dalam skema",
          "Bentuk dokumen fleksibel; validator dapat ditambahkan",
        ],
        [
          "Contoh users",
          "name, email, age",
          "name, email, age, profile, interests, ...",
        ],
        [
          "Hubungan data",
          "Foreign key dan JOIN",
          "Embedding atau reference; aggregation untuk penggabungan",
        ],
        [
          "Validasi",
          "NOT NULL, UNIQUE, CHECK, foreign key",
          "Validasi aplikasi, unique index, dan schema validation",
        ],
        [
          "Transaksi",
          "Transaksi ACID pada engine seperti InnoDB",
          "Operasi satu dokumen atomik; transaksi multi-dokumen didukung",
        ],
        [
          "Cocok saat",
          "Relasi dan aturan integritas perlu ditegakkan",
          "Profil atau konten memiliki bentuk yang bervariasi",
        ],
        [
          "Bukan aturan mutlak",
          "RDBMS juga dapat menyimpan JSON",
          "MongoDB juga memerlukan desain skema yang dipikirkan",
        ],
      ]
        .map(
          (row) =>
            `<tr>${row.map((value, i) => (i === 0 ? `<th scope="row">${value}</th>` : `<td>${value}</td>`)).join("")}</tr>`,
        )
        .join(
          "",
        )}</tbody></table></section><div class="learning-grid"><section class="panel learning-card"><span class="large-symbol">${icon("database")}</span><h2>Pendaftaran siswa: relasional.</h2><p>Identitas siswa mempunyai struktur tetap. Relasi ke pengguna, program studi, dan dokumen dapat ditambahkan melalui foreign key.</p><a class="text-link" href="/siswa">Coba studi kasus ${icon("arrow")}</a></section><section class="panel learning-card"><span class="large-symbol mint">${icon("leaf")}</span><h2>Profil pengguna: dokumen.</h2><p>Satu pengguna punya minat dan tautan sosial, pengguna lain punya pendidikan dan keterampilan. Profil dapat tumbuh sesuai kebutuhan.</p><a class="text-link" href="/mongodb">Lihat profil fleksibel ${icon("arrow")}</a></section></div>`,
  );
}

export function errorPage(ctx, status, title, message) {
  return layout(
    ctx,
    title,
    "",
    `<section class="panel error-panel"><p class="eyebrow">${status}</p><span class="large-symbol">${icon("database")}</span><h1>${e(title)}</h1><p>${e(message)}</p><a class="button primary" href="/">Kembali ke ringkasan</a><a class="text-link" href="/spesifikasi">Lihat spesifikasi proyek ${icon("arrow")}</a></section>`,
  );
}
