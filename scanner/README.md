# GlobalPath upload scanner (ClamAV)

A small private service that virus-scans student uploads before GlobalPath
staff can open them. It wraps [ClamAV](https://www.clamav.net/), the open-source
antivirus engine, so student documents are never sent to a third-party
scanning company.

```
Student browser ──upload──► Supabase (private, not yet visible)
                                  │
Netlify (finalizeUploadAction) ◄──┘ downloads the bytes
   ├─ type / signature / size / PDF checks   (lib/portal/file-security.ts)
   ├─ POST bytes ──► this scanner ──► clamd ──► {"clean": true|false}
   └─ clean → stores the checked copy and marks it "Pending review"
      infected / scanner down → file deleted, student told, audit entry
```

## What it does

* `POST /scan` with `Authorization: Bearer <SCAN_TOKEN>` and the file as the body.
  Replies `{"clean": true}` or `{"clean": false, "signature": "<name>"}`.
* `GET /health` returns 200 once ClamAV is running.
* Files are scanned in memory and never written to disk. Logs record only the
  result and size, never names or contents.
* ClamAV's `freshclam` updates virus signatures automatically several times a day.

The website **fails closed**: if the scanner is configured but unreachable, or
answers anything unexpected, the upload is refused and the student is asked to
try later.

## Hosting requirements

Any host that runs a Docker container over HTTPS will do: Fly.io, Railway, Render,
Google Cloud Run (min. 1 instance), or a small VPS behind Caddy/nginx.

* **Memory: 2 GB minimum.** ClamAV keeps its signature database in RAM
  (about 1–1.5 GB, briefly more while reloading updates). Smaller machines crash.
* **Always on.** Do not use scale-to-zero; a cold start downloads signatures and
  takes several minutes, during which uploads are refused.
* **Region:** the same region as your Supabase project (e.g. Frankfurt).
* **HTTPS only.** The website sends file bytes and the token to this service.

## Deploy (example: Fly.io)

From this `scanner/` folder, with the [flyctl](https://fly.io/docs/flyctl/) CLI:

```bash
fly launch --no-deploy --name globalpath-scanner --region fra
fly scale memory 2048
fly secrets set SCAN_TOKEN="$(openssl rand -hex 32)"   # keep a copy for Netlify
fly deploy
curl https://globalpath-scanner.fly.dev/health          # wait for {"ok":true}
```

In `fly.toml`, make sure `internal_port = 8080`, `auto_stop_machines = "off"` and
`min_machines_running = 1`.

## Connect the website

In Netlify (Site configuration → Environment variables), mark the token as secret:

| Variable | Value |
| --- | --- |
| `MALWARE_SCAN_URL` | `https://<your-scanner-host>/scan` |
| `MALWARE_SCAN_TOKEN` | the same `SCAN_TOKEN` |
| `MALWARE_SCAN_REQUIRED` | `true` – refuse uploads if the scanner is ever unset |

Redeploy the site.

## Check it works (after deploying)

1. `GET /health` returns `{"ok":true}`.
2. Upload a normal PDF in the portal: staff see the scan result "Clean".
3. Upload the harmless [EICAR test file](https://www.eicar.org/download-anti-malware-testfile/)
   saved as a `.pdf`: it is refused. (The type check may refuse it first because it is not
   a real PDF; to test the scanner itself, call `/scan` directly with `curl --data-binary @eicar.com`.)
4. Stop the scanner briefly: uploads are refused with "temporarily unavailable".

## Tests

`npm run test:scanner` (from the project root) runs the API against a simulated
ClamAV that speaks the real `INSTREAM` protocol: clean/infected results, large
files, bad tokens, size limits and fail-closed behaviour. The Docker image and
real ClamAV detection are only verified after deployment (steps above).
