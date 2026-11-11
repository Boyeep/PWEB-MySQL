import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { handler } from "./src/app.mjs";

const types = {
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
};
const port = Number(process.env.PORT || 4190);
http
  .createServer(async (req, res) => {
    const path = new URL(req.url, "http://localhost").pathname;
    if (path.startsWith("/assets/")) {
      const file = resolve("public", "." + path);
      if (
        !file.startsWith(resolve("public/assets") + "\\") &&
        !file.startsWith(resolve("public/assets") + "/")
      ) {
        res.writeHead(404).end();
        return;
      }
      try {
        const data = await readFile(file);
        res
          .writeHead(200, {
            "Content-Type": types[extname(file)] || "application/octet-stream",
          })
          .end(data);
      } catch {
        res.writeHead(404).end("Aset tidak ditemukan.");
      }
      return;
    }
    await handler(req, res);
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`DataRuang: http://127.0.0.1:${port}`),
  );
