import mysql from "mysql2/promise";
import pg from "pg";
import { readFile } from "node:fs/promises";
import { randomUUID, createHash } from "node:crypto";
import { sampleUsers, sampleStudents } from "./data.mjs";

export const sqlDriver = process.env.SQL_DRIVER || "mysql";
export const sqlLabel =
  sqlDriver === "postgres" ? "PostgreSQL" : "MySQL / MariaDB";
let pool;
let schemaPromise;

function getPool() {
  if (pool) return pool;
  if (sqlDriver === "postgres") {
    if (!process.env.DATABASE_URL)
      throw new Error("DATABASE_URL belum dikonfigurasi.");
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 2,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 8000,
    });
  } else {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || "127.0.0.1",
      port: Number(process.env.MYSQL_PORT || 3306),
      database: process.env.MYSQL_DATABASE || "pweb_mysql_lab",
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD || "",
      connectionLimit: 2,
      connectTimeout: 8000,
      charset: "utf8mb4",
      ssl:
        process.env.MYSQL_SSL === "true"
          ? { rejectUnauthorized: true }
          : undefined,
    });
  }
  return pool;
}

async function query(sql, values = [], connection = null) {
  const target = connection || getPool();
  if (sqlDriver === "postgres") {
    let i = 0;
    return (
      await target.query(
        sql.replace(/\?/g, () => "$" + ++i),
        values,
      )
    ).rows;
  }
  // MariaDB does not prepare transaction-control statements such as BEGIN.
  // Only fixed statements without parameters use the ordinary query protocol.
  return values.length
    ? (await target.execute(sql, values))[0]
    : (await target.query(sql))[0];
}

async function ensureSchema() {
  if (!schemaPromise)
    schemaPromise = (async () => {
      const content = await readFile(
        new URL("../database/mysql.sql", import.meta.url),
        "utf8",
      );
      const statements = content
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.startsWith("CREATE TABLE"));
      for (const statement of statements)
        await query(statement.replace(/\s+ENGINE=InnoDB$/i, ""));
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  return schemaPromise;
}

const seedId = (workspace, kind, index) => {
  const hash = createHash("sha256")
    .update(`${workspace}:${kind}:${index}`)
    .digest("hex")
    .slice(0, 32);
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20)}`;
};

async function transaction(work) {
  const connection =
    sqlDriver === "postgres"
      ? await getPool().connect()
      : await getPool().getConnection();
  try {
    await query("BEGIN", [], connection);
    const result = await work(connection);
    await query("COMMIT", [], connection);
    return result;
  } catch (error) {
    await query("ROLLBACK", [], connection);
    throw error;
  } finally {
    connection.release();
  }
}

export async function ensureSqlWorkspace(workspace) {
  await ensureSchema();
  const existing = await query("SELECT seeded FROM workspaces WHERE id=?", [
    workspace,
  ]);
  if (Number(existing[0]?.seeded)) return;
  // Commit row creation before locking it, avoiding duplicate-key lock upgrades.
  const insert =
    sqlDriver === "postgres"
      ? "INSERT INTO workspaces (id,created_at,seeded) VALUES (?,?,0) ON CONFLICT (id) DO NOTHING"
      : "INSERT IGNORE INTO workspaces (id,created_at,seeded) VALUES (?,?,0)";
  await query(insert, [workspace, new Date().toISOString()]);
  await transaction(async (connection) => {
    const rows = await query(
      "SELECT seeded FROM workspaces WHERE id=? FOR UPDATE",
      [workspace],
      connection,
    );
    if (Number(rows[0].seeded)) return;
    for (const [i, row] of sampleUsers.entries())
      await query(
        "INSERT INTO users (id,workspace_id,name,email,age,created_at) VALUES (?,?,?,?,?,?)",
        [
          seedId(workspace, "user", i),
          workspace,
          row.name,
          row.email,
          row.age,
          new Date().toISOString(),
        ],
        connection,
      );
    for (const [i, row] of sampleStudents.entries())
      await query(
        "INSERT INTO calon_siswa (id,workspace_id,nama,alamat,jenis_kelamin,agama,sekolah_asal,created_at) VALUES (?,?,?,?,?,?,?,?)",
        [
          seedId(workspace, "student", i),
          workspace,
          row.nama,
          row.alamat,
          row.jenis_kelamin,
          row.agama,
          row.sekolah_asal,
          new Date().toISOString(),
        ],
        connection,
      );
    await query(
      "UPDATE workspaces SET seeded=1 WHERE id=?",
      [workspace],
      connection,
    );
  });
}

const tableFor = (kind) => (kind === "siswa" ? "calon_siswa" : "users");
const columnsFor = (kind) =>
  kind === "siswa"
    ? ["nama", "alamat", "jenis_kelamin", "agama", "sekolah_asal"]
    : ["name", "email", "age"];
const validId = (id) => typeof id === "string" && /^[0-9a-f-]{36}$/.test(id);

export async function listSql(workspace, kind, search = "") {
  await ensureSqlWorkspace(workspace);
  const table = tableFor(kind);
  const columns =
    kind === "siswa" ? ["nama", "sekolah_asal"] : ["name", "email"];
  const params = [workspace];
  let filter = "";
  if (search) {
    const pattern = "%" + search.replace(/[!%_]/g, (char) => "!" + char) + "%";
    filter = ` AND (LOWER(${columns[0]}) LIKE ? ESCAPE '!' OR LOWER(${columns[1]}) LIKE ? ESCAPE '!')`;
    params.push(pattern.toLowerCase(), pattern.toLowerCase());
  }
  return query(
    `SELECT * FROM ${table} WHERE workspace_id=?${filter} ORDER BY created_at DESC, id ASC`,
    params,
  );
}

export async function findSql(workspace, kind, id) {
  if (!validId(id)) return null;
  await ensureSqlWorkspace(workspace);
  return (
    (
      await query(
        `SELECT * FROM ${tableFor(kind)} WHERE workspace_id=? AND id=?`,
        [workspace, id],
      )
    )[0] || null
  );
}

export async function saveSql(workspace, kind, data, id = null) {
  await ensureSqlWorkspace(workspace);
  return transaction(async (connection) => {
    await query(
      "SELECT id FROM workspaces WHERE id=? FOR UPDATE",
      [workspace],
      connection,
    );
    const table = tableFor(kind),
      columns = columnsFor(kind);
    if (id) {
      if (
        !validId(id) ||
        !(
          await query(
            `SELECT id FROM ${table} WHERE workspace_id=? AND id=?`,
            [workspace, id],
            connection,
          )
        ).length
      )
        return null;
      await query(
        `UPDATE ${table} SET ${columns.map((column) => column + "=?").join(",")} WHERE workspace_id=? AND id=?`,
        [...columns.map((column) => data[column]), workspace, id],
        connection,
      );
      return id;
    }
    const count = await query(
      `SELECT COUNT(*) AS total FROM ${table} WHERE workspace_id=?`,
      [workspace],
      connection,
    );
    if (Number(count[0].total) >= 100)
      throw Object.assign(new Error("Ruang demo telah mencapai 100 data."), {
        status: 422,
      });
    const nextId = randomUUID();
    const fields = ["id", "workspace_id", ...columns, "created_at"];
    await query(
      `INSERT INTO ${table} (${fields.join(",")}) VALUES (${fields.map(() => "?").join(",")})`,
      [
        nextId,
        workspace,
        ...columns.map((column) => data[column]),
        new Date().toISOString(),
      ],
      connection,
    );
    return nextId;
  });
}

export async function deleteSql(workspace, kind, id) {
  if (!validId(id)) return false;
  await ensureSqlWorkspace(workspace);
  return transaction(async (connection) => {
    await query(
      "SELECT id FROM workspaces WHERE id=? FOR UPDATE",
      [workspace],
      connection,
    );
    const exists = await query(
      `SELECT id FROM ${tableFor(kind)} WHERE workspace_id=? AND id=?`,
      [workspace, id],
      connection,
    );
    if (!exists.length) return false;
    await query(
      `DELETE FROM ${tableFor(kind)} WHERE workspace_id=? AND id=?`,
      [workspace, id],
      connection,
    );
    return true;
  });
}

export async function closeSql() {
  if (pool) await pool.end();
  pool = null;
  schemaPromise = null;
}
