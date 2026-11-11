import { MongoClient, ObjectId } from "mongodb";
import { createHash } from "node:crypto";
import { sampleUsers, sampleProfiles } from "./data.mjs";

let clientPromise;
let indexesPromise;
async function database() {
  if (!process.env.MONGODB_URI)
    throw new Error("MONGODB_URI belum dikonfigurasi.");
  if (!clientPromise)
    clientPromise = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 2,
      serverSelectionTimeoutMS: 8000,
      maxIdleTimeMS: 10000,
    })
      .connect()
      .catch((error) => {
        clientPromise = null;
        throw error;
      });
  return (await clientPromise).db(
    process.env.MONGODB_DATABASE || "pweb_mysql_lab",
  );
}

export async function ensureMongoWorkspace(workspace) {
  const db = await database();
  if (!indexesPromise)
    indexesPromise = Promise.all([
      db
        .collection("users")
        .createIndex({ workspaceId: 1, email: 1 }, { unique: true }),
      db
        .collection("users")
        .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      db
        .collection("workspaces")
        .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    ]).catch((error) => {
      indexesPromise = null;
      throw error;
    });
  await indexesPromise;
  let room = await db.collection("workspaces").findOne({ _id: workspace });
  if (!room) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    await db
      .collection("workspaces")
      .updateOne(
        { _id: workspace },
        { $setOnInsert: { seeded: false, createdAt: new Date(), expiresAt } },
        { upsert: true },
      );
    room = await db.collection("workspaces").findOne({ _id: workspace });
  }
  if (!room.seeded) {
    for (const [i, row] of sampleUsers.entries()) {
      const id = new ObjectId(
        createHash("sha256")
          .update(`${workspace}:${i}`)
          .digest("hex")
          .slice(0, 24),
      );
      await db
        .collection("users")
        .updateOne(
          { _id: id },
          {
            $setOnInsert: {
              workspaceId: workspace,
              ...row,
              profile: sampleProfiles[i],
              createdAt: new Date(),
              expiresAt: room.expiresAt,
            },
          },
          { upsert: true },
        );
    }
    await db
      .collection("workspaces")
      .updateOne({ _id: workspace }, { $set: { seeded: true } });
  }
  return db;
}

const normalize = (row) =>
  row
    ? {
        ...row,
        id: row._id.toHexString(),
        created_at: row.createdAt.toISOString(),
      }
    : null;
const validId = (id) => typeof id === "string" && /^[a-f0-9]{24}$/.test(id);
export async function listMongo(workspace, search = "") {
  const db = await ensureMongoWorkspace(workspace);
  const filter = { workspaceId: workspace };
  if (search) {
    const expression = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: expression, $options: "i" } },
      { email: { $regex: expression, $options: "i" } },
    ];
  }
  return (
    await db
      .collection("users")
      .find(filter)
      .sort({ createdAt: -1, _id: 1 })
      .limit(100)
      .toArray()
  ).map(normalize);
}
export async function findMongo(workspace, id) {
  if (!validId(id)) return null;
  const db = await ensureMongoWorkspace(workspace);
  return normalize(
    await db
      .collection("users")
      .findOne({ _id: new ObjectId(id), workspaceId: workspace }),
  );
}
export async function saveMongo(workspace, data, id = null) {
  const db = await ensureMongoWorkspace(workspace);
  if (id) {
    if (!validId(id)) return null;
    const result = await db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(id), workspaceId: workspace },
        {
          $set: {
            name: data.name,
            email: data.email,
            age: data.age,
            profile: data.profile,
          },
        },
      );
    return result.matchedCount ? id : null;
  }
  if (
    (await db.collection("users").countDocuments({ workspaceId: workspace })) >=
    100
  )
    throw Object.assign(new Error("Ruang demo telah mencapai 100 data."), {
      status: 422,
    });
  const room = await db.collection("workspaces").findOne({ _id: workspace });
  const result = await db
    .collection("users")
    .insertOne({
      workspaceId: workspace,
      name: data.name,
      email: data.email,
      age: data.age,
      profile: data.profile,
      createdAt: new Date(),
      expiresAt: room.expiresAt,
    });
  return result.insertedId.toHexString();
}
export async function deleteMongo(workspace, id) {
  if (!validId(id)) return false;
  const db = await ensureMongoWorkspace(workspace);
  return (
    (
      await db
        .collection("users")
        .deleteOne({ _id: new ObjectId(id), workspaceId: workspace })
    ).deletedCount === 1
  );
}
export async function closeMongo() {
  if (clientPromise) await (await clientPromise).close();
  clientPromise = null;
  indexesPromise = null;
}
