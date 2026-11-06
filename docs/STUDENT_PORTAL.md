# GlobalPath Student Portal – setup & operations

The student portal is an **addition** to the public consultancy website. Visitors can
still browse and request consultations without an account. Registered students
get a private portal at `/portal`; GlobalPath staff get a review area at `/admin`.

The portal stays **switched off** (pages show "not available yet") until the
Supabase environment variables below are set.

```
Public website (unchanged)  ──►  Log in / Create account  ──►  /portal (student)
                                                               profile → education → programmes
                                                               → documents → GlobalPath verification
                                                               → application preparation & tracking
Staff (MFA required)        ──►  /admin  students → document review → application review
                                         → feedback → status updates
```

> GlobalPath "verification" is GlobalPath's internal completeness/legibility review.
> It is not certification by uni-assist, universities or government authorities, and
> submitting an application in the portal does **not** send anything to a university
> or to uni-assist. The UI says this wherever it matters.

---

## 1. Architecture

| Concern | Implementation |
| --- | --- |
| Auth | Supabase Auth (email + password, email verification, password reset, TOTP MFA). No custom crypto. |
| Sessions | `@supabase/ssr` HTTP-only cookies, refreshed by `proxy.ts` on `/portal`, `/admin`, `/login`, `/signup`, `/reset-password`. |
| Database | Supabase Postgres, schema in `supabase/migrations/20261027000000_student_portal.sql`. |
| Authorisation | Row Level Security on every table + column-level grants + `SECURITY DEFINER` workflow functions. Staff powers require an MFA (`aal2`) session. |
| Files | Private bucket `student-documents`. No client storage policies. Browser uploads straight to a single-path signed upload URL; the server then verifies the bytes. Downloads go through `/api/documents/[versionId]` → RLS check → 60-second signed URL → audit log entry. |
| Email | Account emails: Supabase Auth (configure SMTP). Portal updates: optional Resend, generic text only. |
| Hosting | Unchanged: Next.js 16 on Netlify. No new infrastructure. |

### Roles

* **Student** – own profile, qualifications, documents, applications, messages.
* **Reviewer** – sees only students an administrator assigned to them; reviews documents, sets application review statuses, messages students.
* **Administrator** (the client) – sees all students; reviews documents and applications; edits website photos (`/admin/photos`) and testimonials (`/admin/testimonials`, including approving stories students send from `/portal/share-story`); manages reviewers and their assignments, the university/course catalogue, document requirement checklists, consultations, account deletion; reads the audit log.
* **Developer** – a hidden super-administrator: everything an administrator can do, plus granting and removing administrator and developer access. Developer accounts never appear to administrators or reviewers (staff lists, student lists, profiles, audit log) and look like unknown emails in the role form.

Roles live in `staff_roles`, which clients cannot write. Roles change only through
`admin_set_staff_role()` (MFA required, cannot change own role; administrators may only grant or remove the reviewer role).

Website content lives in `site_images` (photo overrides; deleting a row restores the built-in photo) and `site_testimonials`, with uploaded files in the public `site-media` bucket. Public pages read it through `lib/site-content.ts`, which falls back to `data/*.ts` whenever Supabase is unavailable.

### Document lifecycle

`Uploaded → (security check) → Pending review → Under review → Verified | Correction required | Rejected`

* Upload: `begin_document_upload()` (ownership, type, size, replace rules) → signed upload URL → browser PUT with progress → `finalizeUploadAction` downloads the object server-side, checks size, **file signature (magic bytes)**, blocks PDFs with JavaScript/launch/embedded-file markers, runs the optional malware scanner, stores SHA-256, then `finalize_document_version()` (service role only) makes it current. Failed files are deleted.
* Replacing a document creates a new version and resets status to *Pending review*; history is kept.
* A document can be attached to many applications (reuse). Application-specific documents (e.g. motivation letters) belong to one application.

### Application statuses

Draft → Submitted to GlobalPath → Under review → Missing documents / Correction required → Documents verified → GlobalPath review completed → Closed. Students can withdraw, or pull a *Submitted* application back to *Draft* before review starts. Every change is written to `application_status_history` and `audit_logs`.

---

## 2. Supabase setup (one-time)

1. **Create a project** at supabase.com in a region appropriate for your users and legal advice.
2. **Apply the migration**: Dashboard → SQL Editor → paste `supabase/migrations/20261027000000_student_portal.sql` → Run.
   (Or with the CLI: `supabase link` then `supabase db push`.)
   This creates the tables, policies, functions and the private `student-documents` bucket.
3. **Auth → URL configuration**
   * Site URL: your production URL (e.g. `https://globalpath-client-review.netlify.app` until the real domain is live).
   * Redirect URLs: `https://<your-domain>/auth/confirm**` and, for previews, `https://*--globalpath-client-review.netlify.app/auth/confirm**`.
4. **Auth → Providers → Email**: enable *Confirm email*. Set minimum password length to **10**. Enable *Leaked password protection* if your plan allows.
5. **Auth → Multi-factor**: enable **TOTP (App authenticator)**. Required for staff.
6. **Auth → Sessions** (paid plans): consider an inactivity timeout (e.g. 8 h) and time-box for staff safety.
7. **Auth → Rate limits**: review the defaults (sign-ups, sign-ins, OTP/email sends). The app adds a small in-memory throttle on top.
8. **Auth → SMTP**: configure a custom SMTP sender on your domain. The built-in sender is heavily rate-limited and not for production.
9. **Auth → Email templates** – use the token-hash links so verification works on any device/browser:

   | Template | Link |
   | --- | --- |
   | Confirm signup | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/portal` |
   | Reset password | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password` |
   | Change email address | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next=/portal/settings` |

   e.g. `<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/portal">Confirm your email address</a></p>`

10. **Storage**: confirm the `student-documents` bucket shows as **Private** with a 10 MB limit. Do **not** add storage policies; the server handles all access.

## 3. Environment variables (Netlify → Site configuration → Environment variables)

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | Publishable or legacy *anon* key (`NEXT_PUBLIC_SUPABASE_ANON_KEY` also accepted) |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Secret/service-role key. Server-only. Mark as secret in Netlify. (`SUPABASE_SECRET_KEY` also accepted) |
| `NEXT_PUBLIC_SITE_URL` | yes | Must match the Supabase Site URL; used in email links |
| `RESEND_API_KEY`, `PORTAL_EMAIL_FROM` | optional | Generic update emails. `PORTAL_EMAIL_FROM` e.g. `GlobalPath <portal@yourdomain>` on a verified domain |
| `MALWARE_SCAN_URL`, `MALWARE_SCAN_TOKEN` | strongly recommended | ClamAV service from `scanner/`; see §6 |
| `MALWARE_SCAN_REQUIRED` | production | `true` refuses uploads whenever no scanner is configured |
| `FORM_FORWARD_URL` | existing | Unchanged; consultation forms still need it |

`NEXT_PUBLIC_*` values are built into the site, so **redeploy after changing them**.

## 4. Creating the first administrator

1. Register normally at `/signup` with the administrator's email and verify it.
2. In Supabase SQL Editor run:
   ```sql
   insert into public.staff_roles (user_id, role)
   select id, 'admin' from auth.users where email = 'admin@yourdomain.example';
   ```
3. Sign in. You are sent to `/login/mfa` to set up an authenticator app. Staff tools unlock only after this.
4. Add further staff from **/admin/staff** (they must register first), then assign reviewers to students from each student's page.

For local development only, MFA enforcement can be switched off with
`update public.portal_config set require_staff_mfa = false;` – keep it `true` in production.

## 5. Deploying

The repository already deploys to Netlify (`npx netlify-cli deploy --prod` from this folder, or Git-based builds).

1. Apply the migration and Supabase settings (§2).
2. Add the environment variables (§3) and trigger a new deploy.
3. Netlify's Next.js runtime picks up `proxy.ts` automatically. On the first **preview** deploy, confirm `/portal` redirects to `/login` when signed out.
4. Run the manual checks in §7 on the preview before promoting to production.

## 6. Security notes and remaining work

* **Upload security** (`lib/portal/file-security.ts`, run on the server for every upload before anyone can open it):
  * size must match what the browser announced; file signature (magic bytes) must match PDF/JPG/PNG/WebP;
  * PDFs are refused if they contain JavaScript, launch actions, attached files, rich media, XFA forms or data-submitting forms, including when hidden inside compressed streams or written with `#xx` name escapes; encrypted/password-protected PDFs and decompression bombs are refused;
  * the checked bytes are stored as a new object (`….checked.<ext>`) with the verified content type, and the browser-uploaded original is deleted, so what staff open is exactly what was checked;
  * uploads abandoned for over an hour are cleaned up on the student's next upload; account deletion also sweeps the student's storage folder.
* **Virus scanning** uses the ClamAV service in [`scanner/`](../scanner/README.md), which you host (2 GB RAM, always on). Set `MALWARE_SCAN_URL`, `MALWARE_SCAN_TOKEN` and `MALWARE_SCAN_REQUIRED=true`. Until then uploads are labelled "no malware scanner configured" to staff. The app fails closed if the scanner is configured but unavailable. Trade-off: students with password-protected or form-based PDFs are asked to print them to a new PDF.
* **Rate limiting**: Supabase Auth enforces server-side limits; the app's extra throttle is per serverless instance only. Add a Netlify/WAF rate-limit rule for `/login`, `/signup`, `/forgot-password` and `/api/*` before a public launch.
* **Encryption**: Supabase encrypts data at rest and all traffic is HTTPS. No additional field-level encryption is implemented.
* **Retention**: students can request deletion (*Account Settings*); administrators complete it on the student's page (removes stored files, then the auth user, which cascades all portal rows). Audit-log entries keep the action with the actor set to null. Define a written retention period for inactive accounts; there is no automatic expiry job yet.
* **Privacy Policy must be updated before enabling the portal.** It currently says the website "does not provide document upload or document storage", which becomes untrue. Suggested starting point for counsel review:
  > *Student portal.* If you create an account, we store your profile, academic history, language results, applications and the documents you upload, in a private storage service operated by Supabase (region: …). Only you and authorised GlobalPath staff can access them; access to documents is logged. We keep this information until you ask us to delete your account or for … after your last activity, unless the law requires longer. You can request deletion from Account Settings.
* Admission/immigration information in the catalogue must come from official sources; every listing stores the source URL and the date it was checked.

## 7. Testing

### Done (automated, in this repository)

* `npm run test:db` – applies the migration to PGlite (real Postgres in WebAssembly) with Supabase-style `auth`/`storage` stubs and runs **63 checks**: profile/reference creation, column protection, role escalation, anonymous access, MFA gating, cross-student isolation for profiles/documents/versions/applications/attachments/messages/consultations, upload type/size rules, reviewer assignment scoping, review feedback rules, replacement → re-review, version history, catalogue publishing, document reuse across applications, application workflow and history, notifications, audit-log visibility.
* `npm run test:files` – 13 checks on the upload rules (signatures, hidden/escaped PDF scripts, encryption, decompression bombs, scanner fail-closed handling).
* `npm run test:scanner` – 7 checks on the scanner API against a simulated ClamAV.
* `npm run typecheck`, `npm run lint`, `npm run build` – clean.
* Public-site regression: every public route was rendered before and after the change and diffed. The only differences are the added account button in the header and the Log in / Create account buttons in the mobile menu; titles, descriptions, canonical URLs and robots.txt are unchanged.
* Route protection against a production build: signed-out and forged-cookie requests to `/portal/*` and `/admin/*` redirect to `/login`; `/api/documents/*` returns 401; `?next=//evil.example` is ignored.

### Not yet done – needs a configured Supabase project

These depend on Supabase Auth, Storage and email delivery and **have not been run**:
sign-up email, verification link, login, password reset, MFA enrolment, real file upload/download/preview, signed-URL expiry, Resend emails, consultation request linking after a successful `FORM_FORWARD_URL` delivery, and the admin account-deletion flow. Run them on a preview deploy:

1. Sign up → receive email → verify → land on `/portal?notice=verified`.
2. Log out, log in, reset the password via email.
3. Complete profile, add two qualifications and a language result; check completion %.
4. Upload a PDF and an image; try a renamed `.exe` (must be refused); replace a document.
5. Create two applications; attach the same certificate to both; submit one.
6. As admin: grant a reviewer, assign them to the student, review with *Correction required*; as the student, see the feedback and upload a replacement.
7. Change the application status; check notifications (and emails if Resend is configured).
8. As a second student, open the first student's `/api/documents/<versionId>` and `/portal/applications/<id>` URLs – both must fail.
9. Request a consultation while signed in; confirm it appears in `/portal/consultations` and `/admin/consultations`.
10. Request deletion; as admin, delete the account; confirm files are gone from the bucket.
