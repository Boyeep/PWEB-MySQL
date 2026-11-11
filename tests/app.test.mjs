import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { writeFile } from "node:fs/promises";
import { handler } from "../src/app.mjs";
import { closeSql, sqlLabel } from "../src/sql-store.mjs";
import { closeMongo } from "../src/mongo-store.mjs";

test("DataRuang against real configured SQL and MongoDB servers", async (t) => {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  const checks = [];
  const record = (label, condition) => {
    assert.ok(condition, label);
    checks.push(label);
  };
  function client() {
    const jar = new Map();
    return async function request(path, values = null, options = {}) {
      const headers = {
        Cookie: [...jar].map(([k, v]) => k + "=" + v).join("; "),
        ...options.headers,
      };
      if (values !== null)
        headers["Content-Type"] = "application/x-www-form-urlencoded";
      const response = await fetch(base + path, {
        method: options.method || (values !== null ? "POST" : "GET"),
        headers,
        body: values !== null ? new URLSearchParams(values) : undefined,
        redirect: "manual",
      });
      for (const cookie of response.headers.getSetCookie()) {
        const first = cookie.split(";")[0],
          i = first.indexOf("=");
        jar.set(first.slice(0, i), first.slice(i + 1));
      }
      if (response.status === 303) {
        await response.text();
        return request(response.headers.get("location"));
      }
      return {
        status: response.status,
        body: await response.text(),
        headers: response.headers,
      };
    };
  }
  const csrf = (html) => html.match(/name="csrf" value="([^"]+)"/)[1];
  const ids = (html, kind) =>
    [
      ...html.matchAll(new RegExp(`href="/${kind}/detail\\?id=([^"]+)"`, "g")),
    ].map((match) => match[1]);
  const user = {
    name: "QA <script>alert(1)</script>",
    email: "qa@example.com",
    age: "28",
  };
  const student = {
    nama: "QA Siswa Fiktif",
    alamat: "Jalan Contoh Nomor 20, Surabaya",
    jenis_kelamin: "Perempuan",
    agama: "Islam",
    sekolah_asal: "SMP Uji Fiktif",
  };
  const main = client();
  try {
    const home = await main("/");
    record(
      "Home renders both real database connections",
      home.status === 200 &&
        !home.body.includes("Belum terhubung") &&
        !home.body.includes("<strong>—</strong>"),
    );
    const concurrentHomes = await Promise.all(
      Array.from({ length: 8 }, () => client()("/")),
    );
    record(
      "Concurrent workspace initialization keeps all counters available",
      concurrentHomes.every(
        (result) =>
          result.status === 200 && !result.body.includes("<strong>—</strong>"),
      ),
    );
    for (const kind of ["rdbms", "mongodb", "siswa"]) {
      await t.test(kind + " CRUD, validation, and isolation", async () => {
        const initial = await main("/" + kind);
        record(
          kind + ": four seed records",
          initial.status === 200 && ids(initial.body, kind).length === 4,
        );
        const form = await main("/" + kind + "/new");
        const token = csrf(form.body);
        let data = { ...(kind === "siswa" ? student : user), csrf: token };
        if (kind === "mongodb")
          data.profile = JSON.stringify({
            city: "Surabaya",
            interests: ["SQL", "Desain"],
            education: { semester: 3 },
            active: true,
          });
        record(
          kind + ": CSRF rejects writes",
          (await main("/" + kind + "/save", { ...data, csrf: "wrong" }))
            .status === 403,
        );
        record(
          kind + ": server validates required fields",
          (await main("/" + kind + "/save", { csrf: token })).status === 422,
        );
        record(
          kind + ": GET cannot save",
          (await main("/" + kind + "/save")).status === 405,
        );
        if (kind !== "siswa") {
          record(
            kind + ": rejects fractional age",
            (await main("/" + kind + "/save", { ...data, age: "2.5" }))
              .status === 422,
          );
          record(
            kind + ": rejects out-of-range age",
            (await main("/" + kind + "/save", { ...data, age: "121" }))
              .status === 422,
          );
          record(
            kind + ": validates email",
            (await main("/" + kind + "/save", { ...data, email: "invalid" }))
              .status === 422,
          );
        }
        if (kind === "mongodb") {
          for (const profile of [
            "{bad json}",
            "[]",
            '{"$where":"unsafe"}',
            '{"nested":{"__proto__":{"polluted":true}}}',
          ]) {
            record(
              "MongoDB: rejects invalid or unsafe JSON " + checks.length,
              (await main("/mongodb/save", { ...data, profile })).status ===
                422,
            );
          }
        }
        const created = await main("/" + kind + "/save", data);
        record(
          kind + ": creates and persists record",
          created.status === 200 &&
            created.body.includes("Data baru berhasil disimpan."),
        );
        if (kind !== "siswa")
          record(
            kind + ": escapes stored HTML",
            created.body.includes("&lt;script&gt;") &&
              !created.body.includes("<script>alert(1)</script>"),
          );
        const search = await main(
          "/" +
            kind +
            "?q=" +
            encodeURIComponent(
              kind === "siswa" ? "QA Siswa" : "qa@example.com",
            ),
        );
        const found = ids(search.body, kind);
        record(kind + ": search finds one record", found.length === 1);
        const id = found[0],
          path = "/" + kind + "/detail?id=" + id;
        const detail = await main(path);
        record(
          kind + ": detail reads saved data",
          detail.status === 200 &&
            detail.body.includes(
              kind === "siswa" ? "SMP Uji Fiktif" : "qa@example.com",
            ),
        );
        if (kind === "mongodb")
          record(
            "MongoDB: nested profile is persisted",
            detail.body.includes("&quot;semester&quot;: 3") &&
              detail.body.includes("&quot;interests&quot;"),
          );
        const other = client(),
          otherToken = csrf((await other("/" + kind + "/new")).body);
        record(
          kind + ": another workspace cannot read",
          (await other(path)).status === 404,
        );
        record(
          kind + ": another workspace cannot edit",
          (await other("/" + kind + "/edit?id=" + id)).status === 404,
        );
        record(
          kind + ": another workspace cannot delete",
          (await other("/" + kind + "/delete", { id, csrf: otherToken }))
            .status === 404,
        );
        const confirmation = await main("/" + kind + "/delete?id=" + id);
        record(
          kind + ": GET deletion only confirms",
          confirmation.status === 200 &&
            confirmation.body.includes("Hapus data ini?") &&
            (await main(path)).status === 200,
        );
        if (kind === "siswa") data.nama = "QA Siswa Diperbarui";
        else data.name = "QA Pengguna Diperbarui";
        const updated = await main("/" + kind + "/save", { ...data, id });
        record(
          kind + ": update persists",
          updated.status === 200 &&
            updated.body.includes("Perubahan berhasil disimpan.") &&
            (await main(path)).body.includes("Diperbarui"),
        );
        if (kind !== "siswa") {
          const duplicate = await main("/" + kind + "/save", {
            ...data,
            id: "",
            email: "QA@example.com",
          });
          record(
            kind + ": duplicate email rejected case-insensitively",
            duplicate.status === 409 &&
              duplicate.body.includes("Email sudah digunakan"),
          );
        }
        const literal = await main(
          "/" +
            kind +
            "?q=" +
            encodeURIComponent(kind === "mongodb" ? ".*" : "' OR 1=1 --"),
        );
        record(
          kind + ": search treats special input as literal",
          literal.status === 200 && ids(literal.body, kind).length === 0,
        );
        const invalid = await main("/" + kind + "/detail?id=invalid");
        record(kind + ": invalid ID rejected", invalid.status === 404);
        const deleted = await main("/" + kind + "/delete", { id, csrf: token });
        record(
          kind + ": explicit POST deletes data",
          deleted.status === 200 &&
            deleted.body.includes("Data berhasil dihapus.") &&
            (await main(path)).status === 404,
        );
        record(
          kind + ": flash consumed once",
          !(await main("/" + kind)).body.includes("Data berhasil dihapus."),
        );
        // Emptying the disposable workspace must not re-seed it on the next read.
        const remaining = ids((await main("/" + kind)).body, kind);
        for (const seed of remaining)
          assert.equal(
            (await main("/" + kind + "/delete", { id: seed, csrf: token }))
              .status,
            200,
          );
        record(
          kind + ": empty workspace stays empty",
          ids((await main("/" + kind)).body, kind).length === 0,
        );
      });
    }
    for (const path of ["/perbandingan", "/spesifikasi", "/blog"])
      record("Documentation route " + path, (await main(path)).status === 200);
    const summary = JSON.parse((await main("/api/summary")).body);
    record(
      "API reports current workspace only",
      summary.scope === "current-demo-workspace" &&
        Object.values(summary.counts).every((value) => value === 0),
    );
    record(
      "Unknown source path is not exposed",
      (await main("/src/app.mjs")).status === 404,
    );
    record(
      "Unsupported HTTP method rejected",
      (await main("/rdbms", null, { method: "PUT" })).status === 405,
    );
    record(
      "Oversized body rejected",
      (await main("/rdbms/save", { name: "x".repeat(17000) })).status === 413,
    );
    const report = {
      sql_engine: sqlLabel,
      mongodb: "real MongoDB server",
      passed: checks.length,
      checks,
    };
    await writeFile("qa-http.json", JSON.stringify(report, null, 2));
    console.log(
      JSON.stringify({
        passed: checks.length,
        sql_engine: sqlLabel,
        mongodb: report.mongodb,
      }),
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await Promise.all([closeSql(), closeMongo()]);
  }
});
