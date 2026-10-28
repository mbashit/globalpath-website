// Upload checks in lib/portal/file-security.ts. Run: npm run test:files
import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { deflateSync } from "node:zlib";
import { fileProblem, pdfProblem, matchesSignature, scanFile } from "../lib/portal/file-security.ts";

const MAX = 10 * 1024 * 1024;
const bytes = (s) => new Uint8Array(Buffer.from(s, "latin1"));
const pdf = (body) => bytes(`%PDF-1.7\n${body}\n%%EOF\n`);
const withStream = (data) => Buffer.concat([
  Buffer.from("%PDF-1.7\n1 0 obj\n<< /Type /ObjStm /Filter /FlateDecode >>\nstream\n", "latin1"),
  data,
  Buffer.from("\nendstream\nendobj\n%%EOF\n", "latin1"),
]);
const check = (b, mime = "application/pdf") => fileProblem(b, mime, b.byteLength, MAX);

test("plain PDF is accepted", () => {
  assert.equal(check(pdf("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj")), null);
});

test("ordinary words that merely contain JS are accepted", () => {
  assert.equal(check(pdf("<< /JSONData 1 /JSX 2 /Title (JavaScript course certificate) >>")), null);
});

test("visible JavaScript, launch and attachments are refused", () => {
  for (const name of ["/JavaScript", "/JS", "/Launch", "/EmbeddedFile", "/EmbeddedFiles", "/RichMedia", "/XFA", "/SubmitForm", "/ImportData"]) {
    assert.match(check(pdf(`<< /S ${name} (x) >>`)) ?? "", /not accepted/, name);
  }
});

test("hex-escaped names are decoded before checking", () => {
  assert.match(check(pdf("<< /S /J#61vaScript /JS (app.alert(1)) >>")) ?? "", /not accepted/);
  assert.match(check(pdf("<< /S /#4C#61unch >>")) ?? "", /not accepted/);
});

test("JavaScript hidden inside a compressed object stream is refused", () => {
  const hidden = withStream(deflateSync(Buffer.from("<< /S /JavaScript /JS (app.alert(1)) >>")));
  assert.equal(new TextDecoder("latin1").decode(hidden).includes("JavaScript"), false);
  assert.match(check(new Uint8Array(hidden)) ?? "", /not accepted/);
});

test("compressed harmless content is accepted", () => {
  const ok = withStream(deflateSync(Buffer.from("BT /F1 12 Tf (Bachelor of Science) Tj ET")));
  assert.equal(check(new Uint8Array(ok)), null);
});

test("non-Flate streams (e.g. JPEG images) are skipped, not refused", () => {
  const img = withStream(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5]));
  assert.equal(check(new Uint8Array(img)), null);
});

test("decompression bombs are refused", () => {
  const bomb = withStream(deflateSync(Buffer.alloc(9 * 1024 * 1024)));
  assert.ok(bomb.length < 100_000);
  assert.match(pdfProblem(new Uint8Array(bomb)) ?? "", /too complex/);
});

test("encrypted PDFs are refused", () => {
  assert.match(check(pdf("trailer << /Root 1 0 R /Encrypt 5 0 R >>")) ?? "", /encrypted/);
});

test("file signatures must match the declared type", () => {
  const exe = bytes("MZ\x90\x00 This program cannot be run in DOS mode");
  assert.match(check(exe, "application/pdf") ?? "", /does not match its type/);
  assert.match(check(bytes("<html><script>alert(1)</script>%PDF-1.7"), "application/pdf") ?? "", /does not match its type/);
  assert.equal(matchesSignature(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), "image/jpeg"), true);
  assert.equal(matchesSignature(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png"), true);
  assert.equal(matchesSignature(bytes("RIFF\0\0\0\0WEBPVP8 "), "image/webp"), true);
  assert.equal(matchesSignature(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), "image/jpeg"), false);
  assert.equal(matchesSignature(pdf(""), "text/html"), false);
});

test("size must match what the browser announced", () => {
  const b = pdf("x");
  assert.match(fileProblem(b, "application/pdf", b.byteLength + 1, MAX) ?? "", /does not match the selected file/);
});

// ---------------------------------------------------------------- scanner client
async function withScanner(handler, run) {
  const server = createServer(handler);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  process.env.MALWARE_SCAN_URL = `http://127.0.0.1:${server.address().port}/scan`;
  try {
    await run();
  } finally {
    server.close();
    delete process.env.MALWARE_SCAN_URL;
  }
}
const json = (status, body) => (_req, res) => { res.writeHead(status, { "content-type": "application/json" }); res.end(body); };

test("no scanner configured: not_scanned, or failed when scanning is required", async () => {
  delete process.env.MALWARE_SCAN_URL;
  assert.equal(await scanFile(pdf("x"), "a.pdf"), "not_scanned");
  process.env.MALWARE_SCAN_REQUIRED = "true";
  assert.equal(await scanFile(pdf("x"), "a.pdf"), "failed");
  delete process.env.MALWARE_SCAN_REQUIRED;
});

test("scanner answers are mapped and anything odd fails closed", async () => {
  process.env.MALWARE_SCAN_TOKEN = "t".repeat(40);
  let auth;
  await withScanner((req, res) => { auth = req.headers.authorization; json(200, '{"clean":true}')(req, res); }, async () => {
    assert.equal(await scanFile(pdf("x"), "a.pdf"), "clean");
    assert.equal(auth, `Bearer ${"t".repeat(40)}`);
  });
  await withScanner(json(200, '{"clean":false,"signature":"Eicar"}'), async () => assert.equal(await scanFile(pdf("x"), "a.pdf"), "infected"));
  await withScanner(json(200, '{"clean":"yes"}'), async () => assert.equal(await scanFile(pdf("x"), "a.pdf"), "failed"));
  await withScanner(json(200, "not json"), async () => assert.equal(await scanFile(pdf("x"), "a.pdf"), "failed"));
  await withScanner(json(502, '{"clean":true}'), async () => assert.equal(await scanFile(pdf("x"), "a.pdf"), "failed"));
  await withScanner((_q, res) => { res.writeHead(302, { location: "http://example.com/" }); res.end(); }, async () => assert.equal(await scanFile(pdf("x"), "a.pdf"), "failed"));
  process.env.MALWARE_SCAN_URL = "http://127.0.0.1:9/scan"; // nothing listening
  assert.equal(await scanFile(pdf("x"), "a.pdf"), "failed");
  delete process.env.MALWARE_SCAN_URL;
  delete process.env.MALWARE_SCAN_TOKEN;
});
