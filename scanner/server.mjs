// GlobalPath upload scanner: a minimal HTTPS-fronted wrapper around ClamAV.
//
//   POST /scan   Authorization: Bearer <SCAN_TOKEN>, body = file bytes
//                -> 200 {"clean": true} | {"clean": false, "signature": "..."}
//                -> 401 bad token, 413 too large, 502 scanner error
//   GET  /health -> 200 when clamd answers, 503 otherwise
//
// Files are streamed to clamd in memory and never written to disk or logged.
// No dependencies beyond Node.js.

import { createServer } from "node:http";
import { connect } from "node:net";
import { timingSafeEqual, createHash } from "node:crypto";

const PORT = Number(process.env.PORT ?? 8080);
const CLAMD_HOST = process.env.CLAMD_HOST ?? "127.0.0.1";
const CLAMD_PORT = Number(process.env.CLAMD_PORT ?? 3310);
const MAX_BYTES = Number(process.env.MAX_BYTES ?? 10 * 1024 * 1024);
const TOKEN = process.env.SCAN_TOKEN ?? "";

if (TOKEN.length < 32) {
  console.error("SCAN_TOKEN must be set to a random value of at least 32 characters.");
  process.exit(1);
}
const tokenDigest = createHash("sha256").update(TOKEN).digest();

function authorised(header) {
  const match = /^Bearer (.+)$/.exec(header ?? "");
  if (!match) return false;
  return timingSafeEqual(createHash("sha256").update(match[1]).digest(), tokenDigest);
}

/** Send one command to clamd and return its reply (null-terminated "z" protocol). */
function clamd(write, timeoutMs = 60_000) {
  return new Promise((resolve, reject) => {
    const socket = connect({ host: CLAMD_HOST, port: CLAMD_PORT });
    const chunks = [];
    socket.setTimeout(timeoutMs, () => socket.destroy(new Error("clamd timeout")));
    socket.on("connect", () => write(socket));
    socket.on("data", (d) => chunks.push(d));
    socket.on("error", reject);
    socket.on("close", () => resolve(Buffer.concat(chunks).toString("utf8").replace(/\0+$/, "").trim()));
  });
}

export function scanBytes(bytes) {
  return clamd((socket) => {
    socket.write("zINSTREAM\0");
    for (let offset = 0; offset < bytes.length; offset += 64 * 1024) {
      const chunk = bytes.subarray(offset, offset + 64 * 1024);
      const size = Buffer.alloc(4);
      size.writeUInt32BE(chunk.length);
      socket.write(size);
      socket.write(chunk);
    }
    socket.end(Buffer.alloc(4)); // zero-length chunk ends the stream
  }).then((reply) => {
    // "stream: OK" | "stream: <Signature> FOUND" | "... ERROR"
    if (/^stream: OK$/.test(reply)) return { clean: true };
    const found = /^stream: (.+) FOUND$/.exec(reply);
    if (found) return { clean: false, signature: found[1] };
    throw new Error(`unexpected clamd reply: ${reply.slice(0, 200)}`);
  });
}

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

export const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") {
      const reply = await clamd((s) => s.end("zPING\0"), 5_000).catch(() => "");
      return send(res, reply === "PONG" ? 200 : 503, { ok: reply === "PONG" });
    }
    if (req.method !== "POST" || req.url !== "/scan") return send(res, 404, { error: "not found" });
    if (!authorised(req.headers.authorization)) return send(res, 401, { error: "unauthorised" });
    if (Number(req.headers["content-length"] ?? 0) > MAX_BYTES) return send(res, 413, { error: "too large" });

    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > MAX_BYTES) return send(res, 413, { error: "too large" });
      chunks.push(chunk);
    }
    if (size === 0) return send(res, 400, { error: "empty body" });

    const started = Date.now();
    const result = await scanBytes(Buffer.concat(chunks));
    // Log only the outcome; never file names or contents.
    console.log(JSON.stringify({ event: "scan", bytes: size, clean: result.clean, signature: result.signature, ms: Date.now() - started }));
    return send(res, 200, result);
  } catch (error) {
    console.error(JSON.stringify({ event: "scan_error", message: String(error?.message ?? error).slice(0, 200) }));
    if (!res.headersSent) send(res, 502, { error: "scanner unavailable" });
  }
});

// Tests import this module and start the server themselves.
if (process.env.SCANNER_NO_LISTEN !== "1") {
  server.listen(PORT, () => console.log(JSON.stringify({ event: "listening", port: PORT })));
}
