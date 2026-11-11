import { genders, religions } from "./data.mjs";
const text = (data, key) =>
  typeof data[key] === "string" ? data[key].trim() : "";
const length = (value) => Array.from(value).length;

function checkJson(value, depth = 0) {
  if (depth > 5) throw new Error("Profil maksimal memiliki lima tingkat data.");
  if (Array.isArray(value)) {
    if (value.length > 30)
      throw new Error("Array profil maksimal berisi 30 elemen.");
    value.forEach((item) => checkJson(item, depth + 1));
  } else if (value !== null && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (
        !key ||
        key.length > 64 ||
        key.startsWith("$") ||
        key.includes(".") ||
        ["__proto__", "constructor", "prototype"].includes(key)
      )
        throw new Error("Nama properti profil tidak diizinkan.");
      checkJson(item, depth + 1);
    }
  }
}

export function validateUser(input, mongo = false) {
  const data = {
    name: text(input, "name"),
    email: text(input, "email").toLowerCase(),
    age: text(input, "age"),
  };
  const errors = {};
  if (length(data.name) < 2 || length(data.name) > 100)
    errors.name = "Nama harus berisi 2-100 karakter.";
  if (data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.email = "Masukkan alamat email yang valid.";
  if (
    !/^\d{1,3}$/.test(data.age) ||
    Number(data.age) < 1 ||
    Number(data.age) > 120
  )
    errors.age = "Usia harus berupa bilangan bulat 1-120.";
  if (mongo) {
    data.profileText = text(input, "profile") || "{}";
    try {
      if (data.profileText.length > 4000)
        throw new Error("Profil tambahan maksimal 4.000 karakter.");
      data.profile = JSON.parse(data.profileText);
      if (
        !data.profile ||
        Array.isArray(data.profile) ||
        typeof data.profile !== "object"
      )
        throw new Error(
          'Profil harus berupa objek JSON, misalnya {"city":"Surabaya"}.',
        );
      checkJson(data.profile);
    } catch (error) {
      errors.profile =
        error instanceof SyntaxError
          ? "Format JSON belum valid. Periksa tanda kutip dan koma."
          : error.message;
    }
  }
  if (!errors.age) data.age = Number(data.age);
  return { data, errors };
}

export function validateStudent(input) {
  const data = Object.fromEntries(
    ["nama", "alamat", "jenis_kelamin", "agama", "sekolah_asal"].map((key) => [
      key,
      text(input, key),
    ]),
  );
  const errors = {};
  for (const [key, min, max, label] of [
    ["nama", 2, 64, "Nama"],
    ["alamat", 5, 255, "Alamat"],
    ["sekolah_asal", 2, 64, "Sekolah asal"],
  ]) {
    if (length(data[key]) < min || length(data[key]) > max)
      errors[key] = `${label} harus berisi ${min}-${max} karakter.`;
  }
  if (!genders.includes(data.jenis_kelamin))
    errors.jenis_kelamin = "Pilih jenis kelamin yang tersedia.";
  if (!religions.includes(data.agama))
    errors.agama = "Pilih agama atau kepercayaan yang tersedia.";
  return { data, errors };
}
