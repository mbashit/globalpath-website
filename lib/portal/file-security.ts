import { inflateSync, constants as zlib } from "node:zlib";

/*
 * Server-side checks for student uploads. They run on the exact bytes that
 * will be stored, before a version becomes visible to anyone. These checks
 * do not replace a malware scanner; they reject file types and PDF features
 * that GlobalPath never needs, so a large class of attacks never gets in.
 */

export type ScanResult = "clean" | "not_scanned" | "infected" | "failed";

export function matchesSignature(bytes: Uint8Array, mime: string) {
  const ascii = (start: number, len: number) => String.fromCharCode(...bytes.slice(start, start + len));
  switch (mime) {
    case "application/pdf":
      return ascii(0, 5) === "%PDF-";
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b);
    case "image/webp":
      return ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP";
    default:
      return false;
  }
}

// PDF features that can run code, open other files or carry hidden payloads.
const ACTIVE_PDF = /\/(JavaScript|JS|Launch|EmbeddedFiles?|RichMedia|XFA|ImportData|SubmitForm)(?![A-Za-z0-9])/;
const MAX_INFLATED_PER_STREAM = 8 * 1024 * 1024;
const MAX_INFLATED_TOTAL = 64 * 1024 * 1024;

/** PDF names may hide letters as #xx escapes (/J#61vaScript = /JavaScript). */
function normaliseNames(text: string) {
  return text.replace(/#([0-9A-Fa-f]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Returns a student-facing reason when a PDF is refused, otherwise null.
 * Looks at the raw file and inside compressed (Flate) streams, where modern
 * PDFs keep most objects, including scripts.
 */
export function pdfProblem(bytes: Uint8Array): string | null {
  const raw = Buffer.from(bytes);
  const text = raw.toString("latin1");

  if (/\/Encrypt(?![A-Za-z0-9])/.test(text)) {
    return "Password-protected or encrypted PDFs cannot be checked or reviewed. Remove the protection (or print to a new PDF) and try again.";
  }
  if (ACTIVE_PDF.test(normaliseNames(text))) return activeContentReason;

  let inflatedTotal = 0;
  const streamStart = /stream\r?\n/g;
  for (let match = streamStart.exec(text); match; match = streamStart.exec(text)) {
    const start = match.index + match[0].length;
    const end = text.indexOf("endstream", start);
    if (end < 0) break;
    streamStart.lastIndex = end + 9;
    let inflated: Buffer;
    try {
      inflated = inflateSync(raw.subarray(start, end), {
        maxOutputLength: MAX_INFLATED_PER_STREAM,
        finishFlush: zlib.Z_SYNC_FLUSH,
      });
    } catch (error) {
      // Not Flate data (e.g. a JPEG image), or larger than any real document needs.
      if ((error as { code?: string }).code === "ERR_BUFFER_TOO_LARGE") return tooComplexReason;
      continue;
    }
    inflatedTotal += inflated.length;
    if (inflatedTotal > MAX_INFLATED_TOTAL) return tooComplexReason;
    if (ACTIVE_PDF.test(normaliseNames(inflated.toString("latin1")))) return activeContentReason;
  }
  return null;
}

const activeContentReason =
  "PDFs containing scripts, forms that send data, launch actions or attached files are not accepted. Print or export the document to a new PDF and try again.";
const tooComplexReason =
  "This PDF is too complex to check safely. Print or export it to a new PDF and try again.";

/** Returns a student-facing reason when the file is refused, otherwise null. */
export function fileProblem(bytes: Uint8Array, mime: string, expectedSize: number, maxBytes: number): string | null {
  if (bytes.byteLength !== expectedSize || bytes.byteLength > maxBytes) {
    return "The uploaded file does not match the selected file. Please try again.";
  }
  if (!matchesSignature(bytes, mime)) {
    return "The file content does not match its type. Upload a genuine PDF, JPG, PNG or WebP file.";
  }
  return mime === "application/pdf" ? pdfProblem(bytes) : null;
}

/**
 * External malware scanner (see scanner/ in this repository). Fails closed:
 * a configured scanner that is unreachable or answers oddly blocks the
 * upload. With MALWARE_SCAN_REQUIRED=true, uploads are refused while no
 * scanner is configured at all.
 */
export async function scanFile(bytes: Uint8Array, fileName: string): Promise<ScanResult> {
  const url = process.env.MALWARE_SCAN_URL;
  if (!url) return process.env.MALWARE_SCAN_REQUIRED === "true" ? "failed" : "not_scanned";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-File-Name": encodeURIComponent(fileName),
        ...(process.env.MALWARE_SCAN_TOKEN ? { Authorization: `Bearer ${process.env.MALWARE_SCAN_TOKEN}` } : {}),
      },
      body: Buffer.from(bytes),
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return "failed";
    const result = (await res.json()) as { clean?: unknown };
    return result.clean === true ? "clean" : result.clean === false ? "infected" : "failed";
  } catch {
    return "failed";
  }
}
