// Applies the portal migrations to PGlite (Postgres in WebAssembly) with
// Supabase-like auth/storage stubs and exercises the access-control and
// workflow rules. Run with: npm run test:db
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = join(import.meta.dirname, "..", "migrations");
const migration = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort().map((f) => readFileSync(join(dir, f), "utf8")).join("\n");
const db = new PGlite();

const results = [];
const ok = (name, cond, detail = "") => results.push({ name, pass: !!cond, detail });

await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

  create schema auth;
  grant usage on schema auth to anon, authenticated, service_role;
  create table auth.users (
    id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb, email_confirmed_at timestamptz
  );
  create function auth.jwt() returns jsonb language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
  grant execute on function auth.jwt(), auth.uid() to anon, authenticated, service_role;

  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
`);

await db.exec(migration);
ok("migration applies", true);

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const R = "00000000-0000-0000-0000-00000000000c";
const M = "00000000-0000-0000-0000-00000000000d";

for (const [id, email, fn] of [[A, "a@x.test", "Ada"], [B, "b@x.test", "Ben"], [R, "r@x.test", "Rita"], [M, "m@x.test", "Max"]]) {
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`, [id, email, { first_name: fn, last_name: "Test", accepted_terms: "true" }]);
}
// bootstrap admin exactly as documented
await db.exec(`insert into public.staff_roles (user_id, role) values ('${M}', 'admin');`);

async function as(user, aal, fn) {
  await db.exec(`reset role;`);
  if (user === "anon") {
    await db.exec(`set role anon; select set_config('request.jwt.claims', '{"role":"anon"}', false);`);
  } else if (user === "service") {
    await db.exec(`set role service_role; select set_config('request.jwt.claims', '{"role":"service_role"}', false);`);
  } else {
    await db.exec(`set role authenticated; select set_config('request.jwt.claims', '${JSON.stringify({ sub: user, role: "authenticated", aal })}', false);`);
  }
  try {
    return await fn();
  } finally {
    await db.exec(`reset role;`);
  }
}
async function fails(sql, params = []) {
  try {
    await db.query(sql, params);
    return null;
  } catch (e) {
    return e.message;
  }
}
const rows = async (sql, params = []) => (await db.query(sql, params)).rows;

// --- profiles & references ---------------------------------------------
const refs = await rows(`select applicant_ref, first_name, terms_accepted_at is not null as terms from public.profiles order by applicant_ref`);
ok("profiles auto-created with GP-YYYY-NNNNN refs", refs.length === 4 && /^GP-\d{4}-00001$/.test(refs[0].applicant_ref), JSON.stringify(refs[0]));
ok("terms acceptance recorded", refs.every((r) => r.terms));
ok("welcome notification created", (await rows(`select count(*)::int c from public.notifications where user_id = $1`, [A]))[0].c === 1);

await db.exec(`update auth.users set email_confirmed_at = now() where id = '${A}'`);
ok("email verified notification", (await rows(`select count(*)::int c from public.notifications where user_id = $1 and title = 'Email verified'`, [A]))[0].c === 1);

await as(A, "aal1", async () => {
  ok("student sees only own profile", (await rows(`select id from public.profiles`)).length === 1);
  ok("student can edit own name", (await rows(`update public.profiles set first_name = 'Adaeze' where id = $1 returning id`, [A])).length === 1);
  const e1 = await fails(`update public.profiles set applicant_ref = 'GP-HACK' where id = $1`, [A]);
  ok("student cannot change applicant ref", e1 && /permission denied/.test(e1), e1);
  const e2 = await fails(`insert into public.staff_roles (user_id, role) values ($1, 'admin')`, [A]);
  ok("student cannot self-grant admin", e2 && /permission denied/.test(e2), e2);
  const e3 = await fails(`select public.admin_set_staff_role('a@x.test', 'admin')`);
  ok("student cannot call admin role function", e3 && /Not authorised/.test(e3), e3);
  ok("student updates on other profile affect 0 rows", (await rows(`update public.profiles set first_name = 'X' where id = $1 returning id`, [B])).length === 0);
  const e4 = await fails(`select public.notify($1, 'x', 'x', 'x', 'x')`, [B]);
  ok("student cannot call internal notify()", e4 && /permission denied/.test(e4), e4);
  const e5 = await fails(`select public.finalize_document_version(gen_random_uuid(), 'x', 'clean')`);
  ok("student cannot call finalize_document_version()", e5 && /permission denied/.test(e5), e5);
});

await as("anon", null, async () => {
  const e = await fails(`select * from public.profiles`);
  ok("anonymous role has no table access", e && /permission denied/.test(e), e);
});

// --- admin grants reviewer (requires MFA) ------------------------------
await as(M, "aal1", async () => {
  const e = await fails(`select public.admin_set_staff_role('r@x.test', 'reviewer')`);
  ok("admin without MFA (aal1) has no admin powers", e && /Not authorised/.test(e), e);
});
await as(M, "aal2", async () => {
  await db.query(`select public.admin_set_staff_role('r@x.test', 'reviewer')`);
  ok("admin with MFA grants reviewer", true);
  const e = await fails(`select public.admin_set_staff_role('m@x.test', 'reviewer')`);
  ok("admin cannot change own role", e && /own role/.test(e), e);
});

// --- documents ---------------------------------------------------------
let docA, verA, pathA;
await as(A, "aal1", async () => {
  const r = (await rows(`select * from public.begin_document_upload(null, 'transcript', 'My transcript', null, 'transcript.pdf', 'application/pdf', 2048)`))[0];
  docA = r.document_id; verA = r.version_id; pathA = r.storage_path;
  ok("begin upload returns owner-scoped path", pathA.startsWith(A + "/" + docA + "/"), pathA);
  const e1 = await fails(`select * from public.begin_document_upload(null, 'transcript', 'x', null, 'x.exe', 'application/x-msdownload', 10)`);
  ok("disallowed mime rejected", e1 && /Only PDF/.test(e1), e1);
  const e2 = await fails(`select * from public.begin_document_upload(null, 'transcript', 'x', null, 'x.pdf', 'application/pdf', 20000000)`);
  ok("oversize rejected", e2 && /10 MB/.test(e2), e2);
  const e3 = await fails(`update public.documents set status = 'verified' where id = $1`, [docA]);
  ok("student cannot set own document status", e3 && /permission denied/.test(e3), e3);
});
await as(B, "aal1", async () => {
  ok("other student cannot see A's documents", (await rows(`select id from public.documents where id = $1`, [docA])).length === 0);
  ok("other student cannot see A's versions", (await rows(`select id from public.document_versions where id = $1`, [verA])).length === 0);
  const e = await fails(`select * from public.begin_document_upload($1, null, null, null, 'evil.pdf', 'application/pdf', 100)`, [docA]);
  ok("other student cannot replace A's document", e && /not found/.test(e), e);
});
await as("service", null, async () => {
  const s = (await rows(`select public.finalize_document_version($1, 'abc', 'not_scanned') as s`, [verA]))[0].s;
  ok("finalize moves document to pending_review", s === "pending_review", s);
  const e = await fails(`select public.finalize_document_version($1, 'abc', 'clean')`, [verA]);
  ok("finalize cannot run twice", !!e, e);
});

// --- paid review gate --------------------------------------------------
// Staff may review a document only once it is in a paid, submitted application.
let gateApp;
await as("service", null, async () => {
  const u = (await rows(`insert into public.universities (name, country, source_url, verified_on, published) values ('Gate University', 'Germany', 'https://example.org/g', current_date, true) returning id`))[0].id;
  const c = (await rows(`insert into public.courses (university_id, name, degree_level, source_url, verified_on, published) values ($1, 'BSc Gate', 'bachelor', 'https://example.org/g/bsc', current_date, true) returning id`, [u]))[0].id;
  gateApp = (await rows(`insert into public.applications (student_id, course_id) values ($1, $2) returning id`, [A, c]))[0].id;
  await db.query(`insert into public.application_documents (application_id, document_id) values ($1, $2)`, [gateApp, docA]);
});
const unlocked = async () => (await rows(`select public.review_unlocked(d) as u from public.documents d where id = $1`, [docA]))[0].u;
await as(M, "aal2", async () => {
  ok("review locked while application is unpaid", (await unlocked()) === false);
  const e = await fails(`select public.staff_review_document($1, 'under_review', null)`, [docA]);
  ok("staff cannot review an unpaid document", e && /paid, submitted application/.test(e), e);
});
await as("service", null, async () => {
  await db.query(`insert into public.application_payments (application_id, student_id, reference, amount_minor, currency) values ($1, $2, 'ps-gate', 4000, 'USD')`, [gateApp, A]);
});
await as(M, "aal2", async () => {
  ok("review still locked while paid application is a draft", (await unlocked()) === false);
});
await as(A, "aal1", async () => {
  await db.query(`select public.submit_application($1)`, [gateApp]);
  const n = await rows(`select body from public.notifications where user_id = $1 and title = 'Document uploaded'`, [A]);
  ok("upload notification no longer promises an immediate review", n.length > 0 && /once you pay for and submit/.test(n[0].body), n[0]?.body);
});
await as(M, "aal2", async () => {
  ok("review unlocked once paid and submitted", (await unlocked()) === true);
});

// --- reviewer scope ----------------------------------------------------
await as(R, "aal2", async () => {
  ok("unassigned reviewer cannot see student documents", (await rows(`select id from public.documents where id = $1`, [docA])).length === 0);
  const e = await fails(`select public.staff_review_document($1, 'verified', null)`, [docA]);
  ok("unassigned reviewer cannot review", e && /Not authorised/.test(e), e);
});
await as(M, "aal2", async () => {
  await db.query(`select public.admin_assign_reviewer($1, $2, true)`, [R, A]);
});
await as(R, "aal1", async () => {
  ok("assigned reviewer without MFA sees nothing", (await rows(`select id from public.documents where id = $1`, [docA])).length === 0);
});
await as(R, "aal2", async () => {
  ok("assigned reviewer (MFA) sees A's document", (await rows(`select id from public.documents where id = $1`, [docA])).length === 1);
  ok("assigned reviewer cannot see unassigned B", (await rows(`select id from public.profiles where id = $1`, [B])).length === 0);
  const e = await fails(`select public.staff_review_document($1, 'correction_required', '  ')`, [docA]);
  ok("correction request needs feedback", e && /feedback/.test(e), e);
  await db.query(`select public.staff_review_document($1, 'correction_required', 'Please upload a complete transcript showing all semesters.')`, [docA]);
  const e2 = await fails(`select public.admin_set_staff_role('b@x.test', 'admin')`);
  ok("reviewer cannot escalate roles", e2 && /Not authorised/.test(e2), e2);
  const e3 = await fails(`select * from public.audit_logs`);
  ok("reviewer cannot read audit log", !e3 && (await rows(`select * from public.audit_logs`)).length === 0, e3);
});
await as(A, "aal1", async () => {
  const d = (await rows(`select status, latest_feedback from public.documents where id = $1`, [docA]))[0];
  ok("student sees correction + feedback", d.status === "correction_required" && /all semesters/.test(d.latest_feedback), JSON.stringify(d));
  const n = await rows(`select title from public.notifications where user_id = $1 and title = 'Correction requested'`, [A]);
  ok("student notified of correction", n.length === 1);
  const rv = await rows(`select reviewer_id from public.document_reviews where document_id = $1 and reviewer_id is not null`, [docA]);
  ok("review records the reviewer", rv.length === 1 && rv[0].reviewer_id === R);
  const r = (await rows(`select * from public.begin_document_upload($1, null, null, null, 'transcript-full.pdf', 'application/pdf', 4096)`, [docA]))[0];
  verA = r.version_id;
});
await as("service", null, async () => {
  await db.query(`select public.finalize_document_version($1, 'def', 'clean')`, [verA]);
});
await as(A, "aal1", async () => {
  const d = (await rows(`select d.status, v.version_no from public.documents d join public.document_versions v on v.id = d.current_version_id where d.id = $1`, [docA]))[0];
  ok("replacement resets to pending_review as version 2", d.status === "pending_review" && d.version_no === 2, JSON.stringify(d));
  ok("version history kept", (await rows(`select id from public.document_versions where document_id = $1`, [docA])).length === 2);
});

// --- catalogue & applications -----------------------------------------
let courseId, draftCourseId;
await as(A, "aal1", async () => {
  const e = await fails(`insert into public.universities (name, country, source_url, verified_on) values ('Fake U', 'Germany', 'https://x', current_date)`);
  ok("student cannot add universities", e && /row-level security|permission denied/.test(e), e);
});
await as(M, "aal2", async () => {
  const u = (await rows(`insert into public.universities (name, country, source_url, verified_on, published) values ('Example University', 'Germany', 'https://example.org', current_date, true) returning id`))[0].id;
  courseId = (await rows(`insert into public.courses (university_id, name, degree_level, source_url, verified_on, published) values ($1, 'MSc Example', 'master', 'https://example.org/msc', current_date, true) returning id`, [u]))[0].id;
  draftCourseId = (await rows(`insert into public.courses (university_id, name, degree_level, source_url, verified_on, published) values ($1, 'Unpublished', 'master', 'https://example.org/u', current_date, false) returning id`, [u]))[0].id;
});
let appA, appA2;
await as(A, "aal1", async () => {
  ok("student cannot see unpublished courses", (await rows(`select id from public.courses where id = $1`, [draftCourseId])).length === 0);
  const e0 = await fails(`insert into public.applications (course_id) values ($1)`, [draftCourseId]);
  ok("cannot apply to unpublished course", e0 && /published/.test(e0), e0);
  appA = (await rows(`insert into public.applications (course_id, intake) values ($1, 'Winter') returning id, programme_snapshot, degree_level, status`, [courseId]))[0];
  ok("application created as draft with snapshot", appA.status === "draft" && /MSc Example – Example University/.test(appA.programme_snapshot), JSON.stringify(appA));
  appA2 = (await rows(`insert into public.applications (course_id) values ($1) returning id`, [courseId]))[0];
  const e1 = await fails(`select public.submit_application($1)`, [appA.id]);
  ok("submit requires a document", e1 && /Attach/.test(e1), e1);
  await db.query(`insert into public.application_documents (application_id, document_id) values ($1, $2)`, [appA.id, docA]);
  await db.query(`insert into public.application_documents (application_id, document_id) values ($1, $2)`, [appA2.id, docA]);
  // docA is also attached to gateApp from the paid-review section above.
  ok("one document reused across applications", (await rows(`select * from public.application_documents where document_id = $1`, [docA])).length === 3);
  const e2 = await fails(`update public.applications set status = 'review_completed' where id = $1`, [appA.id]);
  ok("student cannot set application status directly", e2 && /permission denied/.test(e2), e2);
  const eFee = await fails(`select public.submit_application($1)`, [appA.id]);
  ok("submit requires the application fee", eFee && /application fee/.test(eFee), eFee);
  const ePay = await fails(`insert into public.application_payments (application_id, student_id, reference, amount_minor, currency) values ($1, $2, 'fake-ref', 4000, 'USD')`, [appA.id, A]);
  ok("student cannot record a payment", ePay && /permission denied/.test(ePay), ePay);
});
// Only the server (service role, after Paystack confirms) records payments.
await as("service", null, async () => {
  await db.query(`insert into public.application_payments (application_id, student_id, reference, amount_minor, currency) values ($1, $2, 'ps-ref-1', 4000, 'USD')`, [appA.id, A]);
  await db.query(`insert into public.application_payments (application_id, student_id, reference, amount_minor, currency) values ($1, $2, 'ps-ref-2', 4000, 'USD')`, [appA2.id, A]);
  const eDup = await fails(`insert into public.application_payments (application_id, student_id, reference, amount_minor, currency) values ($1, $2, 'ps-ref-3', 4000, 'USD')`, [appA.id, A]);
  ok("one payment per application", eDup && /duplicate|unique/.test(eDup), eDup);
});
await as(A, "aal1", async () => {
  ok("student sees own payment", (await rows(`select reference from public.application_payments where application_id = $1`, [appA.id])).length === 1);
  ok("paid draft cannot be deleted", (await rows(`delete from public.applications where id = $1 returning id`, [appA2.id])).length === 0);
  const eUpd = await fails(`update public.application_payments set amount_minor = 1 where application_id = $1`, [appA.id]);
  ok("student cannot change a payment", eUpd && /permission denied/.test(eUpd), eUpd);
  await db.query(`select public.submit_application($1)`, [appA.id]);
  ok("submit works", (await rows(`select status from public.applications where id = $1`, [appA.id]))[0].status === "submitted");
  ok("submitted application locked for edits", (await rows(`update public.applications set intake = 'x' where id = $1 returning id`, [appA.id])).length === 0);
});
await as(B, "aal1", async () => {
  ok("B cannot see A's applications", (await rows(`select id from public.applications`)).length === 0);
  ok("B cannot see A's payments", (await rows(`select id from public.application_payments`)).length === 0);
  const bdoc = (await rows(`select * from public.begin_document_upload(null, 'cv', 'CV', null, 'cv.pdf', 'application/pdf', 100)`))[0];
  const e = await fails(`insert into public.application_documents (application_id, document_id) values ($1, $2)`, [appA2.id, bdoc.document_id]);
  ok("B cannot attach to A's application", e && /row-level security/.test(e), e);
  const bapp = (await rows(`insert into public.applications (course_id) values ($1) returning id`, [courseId]))[0];
  const e2 = await fails(`insert into public.application_documents (application_id, document_id) values ($1, $2)`, [bapp.id, docA]);
  ok("B cannot attach A's document to own application", e2 && /row-level security/.test(e2), e2);
  const e3 = await fails(`select public.submit_application($1)`, [appA2.id]);
  ok("B cannot submit A's application", e3 && /not found/.test(e3), e3);
});
await as(R, "aal2", async () => {
  await db.query(`select public.staff_set_application_status($1, 'under_review', null)`, [appA.id]);
  const e = await fails(`select public.staff_set_application_status($1, 'missing_documents', '')`, [appA.id]);
  ok("missing documents needs feedback", e && /feedback/.test(e), e);
  await db.query(`select public.staff_set_application_status($1, 'missing_documents', 'Please attach your CV.')`, [appA.id]);
  await db.query(`insert into public.messages (student_id, body) values ($1, 'Hello from GlobalPath')`, [A]);
  const e2 = await fails(`insert into public.messages (student_id, body) values ($1, 'hi')`, [B]);
  ok("reviewer cannot message unassigned student", e2 && /row-level security/.test(e2), e2);
});
await as(A, "aal1", async () => {
  const h = await rows(`select to_status from public.application_status_history where application_id = $1 order by created_at`, [appA.id]);
  ok("status history recorded", h.map((x) => x.to_status).join(",") === "submitted,under_review,missing_documents", h.map((x) => x.to_status).join(","));
  ok("application editable again after missing documents", (await rows(`update public.applications set intake = 'Summer' where id = $1 returning id`, [appA.id])).length === 1);
  ok("student received message notification", (await rows(`select id from public.notifications where kind = 'message'`)).length === 1);
  await db.query(`insert into public.consultation_requests (service, destination) values ('Study abroad', 'Germany')`);
  const e = await fails(`insert into public.consultation_requests (user_id, service) values ($1, 'x')`, [B]);
  ok("cannot create consultation for another user", !!e, e);
  ok("audit log hidden from students", (await rows(`select * from public.audit_logs`)).length === 0);
  await db.query(`select public.student_update_application_status($1, 'withdrawn')`, [appA2.id]);
  ok("student can withdraw", (await rows(`select status from public.applications where id = $1`, [appA2.id]))[0].status === "withdrawn");
});
await as(M, "aal2", async () => {
  const a = await rows(`select action from public.audit_logs`);
  ok("admin reads audit log", a.length > 5, a.map((x) => x.action).join(","));
  ok("admin sees all students", (await rows(`select id from public.profiles`)).length === 4);
});

// --- developer role (hidden super-admin) --------------------------------
const D = "00000000-0000-0000-0000-0000000000de";
await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, 'dev@x.test', $2)`, [D, { first_name: "Dev", last_name: "Test", accepted_terms: "true" }]);
await db.exec(`insert into public.staff_roles (user_id, role) values ('${D}', 'developer');`);
await as(D, "aal2", async () => {
  ok("developer has admin powers", (await rows(`select public.is_admin() a`))[0].a === true);
  ok("developer sees every account", (await rows(`select id from public.profiles`)).length === 5);
  await db.query(`select public.admin_set_staff_role('b@x.test', 'admin')`);
  ok("developer can grant administrator", (await rows(`select role::text r from public.staff_roles where user_id = $1`, [B]))[0]?.r === "admin");
  await db.query(`select public.admin_set_staff_role('b@x.test', null)`);
  ok("developer can remove administrator", (await rows(`select 1 from public.staff_roles where user_id = $1`, [B])).length === 0);
  ok("developer sees own actions in audit log", (await rows(`select 1 from public.audit_logs where actor_id = $1`, [D])).length === 2);
});
await as(M, "aal2", async () => {
  ok("admin cannot see developer in staff list", (await rows(`select user_id from public.staff_roles where user_id = $1`, [D])).length === 0);
  ok("admin cannot see developer profile", (await rows(`select id from public.profiles where id = $1`, [D])).length === 0);
  ok("admin still sees the other accounts", (await rows(`select id from public.profiles`)).length === 4);
  ok("admin cannot see developer actions in audit log", (await rows(`select 1 from public.audit_logs where actor_id = $1`, [D])).length === 0);
  const e1 = await fails(`select public.admin_set_staff_role('dev@x.test', null)`);
  ok("admin cannot find developer by email", e1 && /No account uses that email/.test(e1), e1);
  const e2 = await fails(`select public.admin_set_staff_role('b@x.test', 'admin')`);
  ok("admin cannot grant administrator", e2 && /technical support/.test(e2), e2);
  const e3 = await fails(`select public.admin_assign_reviewer($1, $2, true)`, [D, A]);
  ok("admin cannot assign developer as reviewer", e3 && /not a staff member/.test(e3), e3);
  await db.query(`select public.admin_set_staff_role('b@x.test', 'reviewer')`);
  ok("admin can still manage reviewers", (await rows(`select role::text r from public.staff_roles where user_id = $1`, [B]))[0]?.r === "reviewer");
  await db.query(`select public.admin_set_staff_role('b@x.test', null)`);
});
await as(R, "aal2", async () => {
  ok("reviewer cannot see developer in staff list", (await rows(`select user_id from public.staff_roles where user_id = $1`, [D])).length === 0);
});

// --- website content ---------------------------------------------------
await as("anon", null, async () => {
  ok("public sees published sample stories", (await rows(`select id, quote from public.site_testimonials`)).length === 4);
  const e = await fails(`select submitted_by from public.site_testimonials`);
  ok("public cannot read who submitted a story", e && /permission denied/.test(e), e);
  const e2 = await fails(`insert into public.site_images (key, src, alt) values ('hero', '/images/x.jpg', 'Hack')`);
  ok("public cannot change site photos", !!e2, e2);
});
await as(A, "aal1", async () => {
  const [{ submit_testimonial: storyId }] = await rows(`select public.submit_testimonial('GlobalPath explained every step of my German application clearly.', 'Adaeze T.', 'Student · Lagos', 'Germany')`);
  ok("student can submit a story", !!storyId);
  ok("student sees own pending story", (await rows(`select id from public.site_testimonials where status = 'pending'`)).length === 1);
  ok("student cannot publish own story", (await rows(`update public.site_testimonials set status = 'published' where id = $1 returning id`, [storyId])).length === 0);
  const e2 = await fails(`insert into public.site_images (key, src, alt) values ('hero', '/images/x.jpg', 'Hack')`);
  ok("student cannot change site photos", !!e2, e2);
});
await as("anon", null, async () => {
  ok("pending story is not public", (await rows(`select id from public.site_testimonials`)).length === 4);
});
await as(M, "aal2", async () => {
  const pending = await rows(`select id from public.site_testimonials where status = 'pending'`);
  ok("admin sees pending story", pending.length === 1);
  ok("admin can publish a story", (await rows(`update public.site_testimonials set status = 'published' where id = $1 returning id`, [pending[0].id])).length === 1);
  ok("admin can replace a site photo", (await rows(`insert into public.site_images (key, src, alt) values ('hero', 'https://x.supabase.co/storage/v1/object/public/site-media/hero.jpg', 'Students') returning key`)).length === 1);
  const e = await fails(`insert into public.site_images (key, src, alt) values ('about', 'javascript:alert(1)', 'Bad')`);
  ok("site photo must be a site path or https URL", e && /check constraint/.test(e), e);
});
await as(R, "aal2", async () => {
  const e = await fails(`insert into public.site_images (key, src, alt) values ('about', '/images/x.jpg', 'Reviewer')`);
  ok("reviewer cannot change site photos", !!e, e);
});

// --- MFA switch -------------------------------------------------------
await db.exec(`update public.portal_config set require_staff_mfa = false`);
await as(R, "aal1", async () => {
  ok("with MFA enforcement off, aal1 staff work", (await rows(`select public.is_staff() s`))[0].s === true);
});

const failed = results.filter((r) => !r.pass);
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.pass ? "" : "  -> " + r.detail}`);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
