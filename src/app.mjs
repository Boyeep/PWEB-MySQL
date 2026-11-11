import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  listSql,
  findSql,
  saveSql,
  deleteSql,
  sqlLabel,
} from "./sql-store.mjs";
import {
  listMongo,
  findMongo,
  saveMongo,
  deleteMongo,
} from "./mongo-store.mjs";
import { validateUser, validateStudent } from "./validation.mjs";
import {
  layout,
  overview,
  directory,
  formPage,
  detailPage,
  deletePage,
  comparison,
  errorPage,
  heading,
} from "./views.mjs";

const secret =
  process.env.APP_SECRET ||
  (process.env.VERCEL ? "" : randomBytes(32).toString("hex"));
const sign = (value) =>
  createHmac("sha256", secret).update(value).digest("base64url");
const secureEqual = (a, b) =>
  typeof a === "string" &&
  typeof b === "string" &&
  Buffer.byteLength(a) === Buffer.byteLength(b) &&
  timingSafeEqual(Buffer.from(a), Buffer.from(b));
function pack(value) {
  const encoded = Buffer.from(JSON.stringify(value)).toString("base64url");
  return encoded + "." + sign(encoded);
}
function unpack(value) {
  try {
    const [encoded, signature] = String(value || "").split(".");
    return secureEqual(signature, sign(encoded))
      ? JSON.parse(Buffer.from(encoded, "base64url").toString())
      : null;
  } catch {
    return null;
  }
}
function cookie(res, name, value, maxAge = 604800) {
  const current = res.getHeader("Set-Cookie") || [];
  res.setHeader("Set-Cookie", [
    ...(Array.isArray(current) ? current : [current]),
    `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.VERCEL ? " ; Secure" : ""}`,
  ]);
}
function context(req, res) {
  const cookies = Object.fromEntries(
    (req.headers.cookie || "")
      .split(";")
      .map((piece) => piece.trim().split("="))
      .filter((pair) => pair.length === 2),
  );
  let session = unpack(cookies["dr.session"]);
  if (
    !session ||
    !/^[0-9a-f]{32}$/.test(session.id) ||
    !Number.isFinite(session.time) ||
    Date.now() - session.time > 604800000 ||
    session.time > Date.now() + 60000
  ) {
    session = { id: randomBytes(16).toString("hex"), time: Date.now() };
    cookie(res, "dr.session", pack(session));
  }
  const flash = unpack(cookies["dr.flash"]);
  if (cookies["dr.flash"]) cookie(res, "dr.flash", "", 0);
  return {
    workspace: session.id,
    csrf: sign("csrf:" + session.id),
    url: new URL(req.url, "https://" + (req.headers.host || "localhost")),
    flash: flash && Date.now() - flash.time < 60000 ? flash.text : null,
  };
}
function html(res, status, content) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(content);
}
function json(res, status, value) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(value));
}
function redirect(res, path, message) {
  cookie(res, "dr.flash", pack({ text: message, time: Date.now() }), 60);
  res.writeHead(303, { Location: path });
  res.end();
}
async function body(req) {
  if (
    !(req.headers["content-type"] || "").startsWith(
      "application/x-www-form-urlencoded",
    )
  )
    throw Object.assign(new Error("Gunakan formulir yang tersedia."), {
      status: 415,
    });
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body))
    return req.body;
  let raw = typeof req.body === "string" ? req.body : "";
  if (!raw)
    for await (const chunk of req) {
      raw += chunk;
      if (Buffer.byteLength(raw) > 16000)
        throw Object.assign(new Error("Isian formulir terlalu panjang."), {
          status: 413,
        });
    }
  if (Buffer.byteLength(raw) > 16000)
    throw Object.assign(new Error("Isian formulir terlalu panjang."), {
      status: 413,
    });
  const values = Object.create(null);
  for (const [key, value] of new URLSearchParams(raw)) {
    if (Object.hasOwn(values, key))
      throw Object.assign(new Error("Isian formulir ganda tidak diizinkan."), {
        status: 400,
      });
    values[key] = value;
  }
  return values;
}

const routes = new Set(["rdbms", "mongodb", "siswa"]);
const list = (ctx, kind, q = "") =>
  kind === "mongodb"
    ? listMongo(ctx.workspace, q)
    : listSql(ctx.workspace, kind, q);
const find = (ctx, kind, id) =>
  kind === "mongodb"
    ? findMongo(ctx.workspace, id)
    : findSql(ctx.workspace, kind, id);
const save = (ctx, kind, data, id) =>
  kind === "mongodb"
    ? saveMongo(ctx.workspace, data, id)
    : saveSql(ctx.workspace, kind, data, id);
const remove = (ctx, kind, id) =>
  kind === "mongodb"
    ? deleteMongo(ctx.workspace, id)
    : deleteSql(ctx.workspace, kind, id);

export async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' https://raw.githubusercontent.com; style-src 'self' 'unsafe-inline'; script-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  );
  let ctx = {
    url: new URL("http://localhost"),
    csrf: "",
    workspace: "",
    flash: null,
  };
  try {
    if (!secret) throw new Error("APP_SECRET belum dikonfigurasi.");
    ctx = context(req, res);
    const path = ctx.url.pathname.replace(/\/$/, "") || "/";
    const method = req.method || "GET";
    if (!["GET", "POST", "HEAD"].includes(method)) {
      res.setHeader("Allow", "GET, POST, HEAD");
      return html(
        res,
        405,
        errorPage(
          ctx,
          405,
          "Metode tidak didukung.",
          "Gunakan navigasi atau formulir aplikasi.",
        ),
      );
    }
    if (method === "HEAD") {
      res.writeHead(200).end();
      return;
    }
    if (path === "/" && method === "GET") {
      const result = await Promise.allSettled(
        ["rdbms", "mongodb", "siswa"].map((kind) => list(ctx, kind)),
      );
      const stats = Object.fromEntries(
        ["rdbms", "mongodb", "siswa"].map((kind, index) => [
          kind,
          result[index].status === "fulfilled"
            ? result[index].value.length
            : null,
        ]),
      );
      return html(res, 200, overview(ctx, stats));
    }
    if (path === "/perbandingan" && method === "GET")
      return html(res, 200, comparison(ctx));
    if (["/blog", "/spesifikasi"].includes(path) && method === "GET") {
      const blog = path === "/blog";
      const article = await readFile(
        new URL(
          blog ? "../docs/blogspot.html" : "../docs/specification.html",
          import.meta.url,
        ),
        "utf8",
      );
      return html(
        res,
        200,
        layout(
          ctx,
          blog ? "Catatan blog" : "Spesifikasi proyek",
          blog ? "blog" : "spec",
          `<div class="article-shell panel">${article}</div>`,
        ),
      );
    }
    if (path === "/api/summary" && method === "GET") {
      const results = await Promise.allSettled(
        ["rdbms", "mongodb", "siswa"].map((kind) => list(ctx, kind)),
      );
      return json(res, 200, {
        engines: { relational: sqlLabel, document: "MongoDB" },
        counts: Object.fromEntries(
          ["rdbms", "mongodb", "siswa"].map((key, i) => [
            key,
            results[i].status === "fulfilled" ? results[i].value.length : null,
          ]),
        ),
        scope: "current-demo-workspace",
      });
    }
    const match = path.match(
      /^\/(rdbms|mongodb|siswa)(?:\/(new|save|edit|detail|delete))?$/,
    );
    if (!match)
      return html(
        res,
        404,
        errorPage(
          ctx,
          404,
          "Halaman tidak ditemukan.",
          "Alamat yang Anda buka tidak tersedia.",
        ),
      );
    const [, kind, action] = match;
    if (method === "GET") {
      if (!action)
        return html(
          res,
          200,
          directory(
            ctx,
            kind,
            await list(
              ctx,
              kind,
              (ctx.url.searchParams.get("q") || "").slice(0, 100),
            ),
          ),
        );
      if (action === "new") return html(res, 200, formPage(ctx, kind));
      if (action === "save") {
        res.setHeader("Allow", "POST");
        return html(
          res,
          405,
          errorPage(
            ctx,
            405,
            "Gunakan formulir.",
            "Penyimpanan data memerlukan request POST.",
          ),
        );
      }
      const row = await find(ctx, kind, ctx.url.searchParams.get("id"));
      if (!row)
        return html(
          res,
          404,
          errorPage(
            ctx,
            404,
            "Data tidak ditemukan.",
            "Data mungkin telah dihapus atau berada di ruang demo lain.",
          ),
        );
      if (action === "edit")
        return html(
          res,
          200,
          formPage(
            ctx,
            kind,
            {
              ...row,
              profile: row.profile ? JSON.stringify(row.profile, null, 2) : "",
            },
            {},
            true,
          ),
        );
      if (action === "detail")
        return html(res, 200, detailPage(ctx, kind, row));
      if (action === "delete")
        return html(res, 200, deletePage(ctx, kind, row));
    }
    if (method === "POST" && ["save", "delete"].includes(action)) {
      const values = await body(req);
      if (!secureEqual(values.csrf, ctx.csrf))
        return html(
          res,
          403,
          errorPage(
            ctx,
            403,
            "Formulir belum dapat diproses.",
            "Sesi formulir tidak valid. Muat ulang halaman dan coba lagi.",
          ),
        );
      const id = typeof values.id === "string" && values.id ? values.id : null;
      if (action === "delete") {
        if (!id || !(await remove(ctx, kind, id)))
          return html(
            res,
            404,
            errorPage(
              ctx,
              404,
              "Data tidak ditemukan.",
              "Data tidak tersedia di ruang demo ini.",
            ),
          );
        return redirect(res, "/" + kind, "Data berhasil dihapus.");
      }
      if (id && !(await find(ctx, kind, id)))
        return html(
          res,
          404,
          errorPage(
            ctx,
            404,
            "Data tidak ditemukan.",
            "Data tidak tersedia di ruang demo ini.",
          ),
        );
      const { data, errors } =
        kind === "siswa"
          ? validateStudent(values)
          : validateUser(values, kind === "mongodb");
      if (Object.keys(errors).length)
        return html(res, 422, formPage(ctx, kind, values, errors, Boolean(id)));
      try {
        const result = await save(ctx, kind, data, id);
        if (!result)
          return html(
            res,
            404,
            errorPage(
              ctx,
              404,
              "Data tidak ditemukan.",
              "Data mungkin telah dihapus.",
            ),
          );
      } catch (error) {
        if (["ER_DUP_ENTRY", "23505", 11000].includes(error.code))
          return html(
            res,
            409,
            formPage(
              ctx,
              kind,
              values,
              { email: "Email sudah digunakan di ruang demo ini." },
              Boolean(id),
            ),
          );
        throw error;
      }
      return redirect(
        res,
        "/" + kind,
        id ? "Perubahan berhasil disimpan." : "Data baru berhasil disimpan.",
      );
    }
    res.setHeader("Allow", action === "save" ? "POST" : "GET");
    return html(
      res,
      405,
      errorPage(
        ctx,
        405,
        "Metode tidak didukung.",
        "Gunakan navigasi atau formulir yang tersedia.",
      ),
    );
  } catch (error) {
    console.error(
      "DataRuang request failed:",
      error.code || error.name,
      error.message.replace(
        /mongodb(?:\+srv)?:\/\/\S+|postgres(?:ql)?:\/\/\S+/g,
        "[redacted URI]",
      ),
    );
    const status = error.status || 503;
    return html(
      res,
      status,
      errorPage(
        ctx,
        status,
        status === 503
          ? "Koneksi database belum tersedia."
          : "Formulir belum dapat diproses.",
        status === 503
          ? "Database untuk ruang ini belum dapat dihubungi. Coba lagi nanti; panduan konfigurasi tersedia di repository."
          : error.message,
      ),
    );
  }
}
