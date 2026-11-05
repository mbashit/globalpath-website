// Scanner API against a simulated clamd that speaks the real INSTREAM
// protocol. ClamAV itself is only exercised once deployed (see README).
// Run: npm run test:scanner
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createServer as createTcpServer } from "node:net";

const EICAR = "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";
const TOKEN = "s".repeat(48);

// Fake clamd: decodes INSTREAM chunks and flags the EICAR test string.
let clamdUp = true;
const clamd = createTcpServer((socket) => {
  if (!clamdUp) return socket.destroy();
  let buf = Buffer.alloc(0);
  let command = null;
  const data = [];
  socket.on("data", (d) => {
    buf = Buffer.concat([buf, d]);
    if (command === null) {
      const end = buf.indexOf(0);
      if (end < 0) return;
      command = buf.subarray(0, end).toString();
      buf = buf.subarray(end + 1);
      if (command === "zPING") return socket.end("PONG\0");
    }
    while (buf.length >= 4) {
      const len = buf.readUInt32BE(0);
      if (len === 0) {
        const all = Buffer.concat(data).toString("latin1");
        return socket.end(all.includes("EICAR-STANDARD-ANTIVIRUS-TEST-FILE") ? "stream: Win.Test.EICAR_HDB-1 FOUND\0" : "stream: OK\0");
      }
      if (buf.length < 4 + len) return;
      data.push(buf.subarray(4, 4 + len));
      buf = buf.subarray(4 + len);
    }
  });
});
await new Promise((r) => clamd.listen(0, "127.0.0.1", r));

process.env.SCAN_TOKEN = TOKEN;
process.env.CLAMD_PORT = String(clamd.address().port);
process.env.MAX_BYTES = String(1024 * 1024);
process.env.SCANNER_NO_LISTEN = "1";
const { server } = await import("./server.mjs");
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
after(() => { server.close(); clamd.close(); });

const scan = (body, token = TOKEN) =>
  fetch(`${base}/scan`, { method: "POST", headers: token ? { authorization: `Bearer ${token}` } : {}, body });

test("clean file", async () => {
  const res = await scan(Buffer.from("%PDF-1.7 hello"));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { clean: true });
});

test("EICAR test file is reported as infected", async () => {
  const res = await scan(Buffer.from(EICAR));
  assert.deepEqual(await res.json(), { clean: false, signature: "Win.Test.EICAR_HDB-1" });
});

test("files larger than one 64 KB chunk are streamed completely", async () => {
  const big = Buffer.concat([Buffer.alloc(300 * 1024, 0x41), Buffer.from(EICAR)]);
  assert.equal((await (await scan(big)).json()).clean, false);
});

test("wrong or missing token is refused", async () => {
  assert.equal((await scan(Buffer.from("x"), "wrong")).status, 401);
  assert.equal((await scan(Buffer.from("x"), null)).status, 401);
});

test("oversized and empty bodies are refused", async () => {
  assert.equal((await scan(Buffer.alloc(1024 * 1024 + 1))).status, 413);
  assert.equal((await scan(Buffer.alloc(0))).status, 400);
});

test("unknown routes are 404", async () => {
  assert.equal((await fetch(`${base}/scan`)).status, 404);
  assert.equal((await fetch(`${base}/other`, { method: "POST" })).status, 404);
});

test("health reflects clamd and scans fail closed when it is down", async () => {
  assert.equal((await fetch(`${base}/health`)).status, 200);
  clamdUp = false;
  assert.equal((await fetch(`${base}/health`)).status, 503);
  assert.equal((await scan(Buffer.from("x"))).status, 502);
  clamdUp = true;
});
