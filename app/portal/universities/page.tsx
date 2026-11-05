import Link from "next/link";
import { Bookmark, BookmarkCheck, ExternalLink, Search } from "lucide-react";
import { Alert, Badge, Card, EmptyState, PageHeader, buttonClass, inputClass, labelClass } from "@/components/portal/ui";
import { toggleShortlistAction } from "../actions";
import { requireUser } from "@/lib/portal/auth";
import { degreeLevels, formatDate, type DegreeLevel } from "@/lib/portal/constants";
import type { Course, University } from "@/lib/portal/types";

export const metadata = { title: "Find Universities & Courses" };

type CourseWithUni = Course & { universities: Pick<University, "id" | "name" | "country" | "city"> };

export default async function UniversitiesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { supabase, user } = await requireUser("/portal/universities");
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const country = (sp.country ?? "").slice(0, 100);
  const level = sp.level && sp.level in degreeLevels ? (sp.level as DegreeLevel) : "";
  const showSaved = sp.saved === "1";

  const [{ data: unis }, { data: shortlist }] = await Promise.all([
    supabase.from("universities").select("id, name, country, city, website_url, source_url, verified_on, notes, published").order("name"),
    supabase.from("shortlist_items").select("course_id, university_id").eq("student_id", user.id),
  ]);
  const universities = (unis ?? []) as University[];
  const savedCourses = new Set((shortlist ?? []).map((s) => s.course_id).filter(Boolean));
  const countries = [...new Set(universities.map((u) => u.country))].sort();

  let query = supabase
    .from("courses")
    .select("*, universities!inner(id, name, country, city)")
    .order("name")
    .limit(100);
  if (country) query = query.eq("universities.country", country);
  if (level) query = query.eq("degree_level", level);
  if (q) {
    const safe = q.replace(/[%_,().*]/g, " ");
    query = query.or(`name.ilike.%${safe}%,field_of_study.ilike.%${safe}%`);
  }
  const { data: rows } = await query;
  let courses = (rows ?? []) as CourseWithUni[];
  if (q) {
    // Also match on the university name.
    const needle = q.toLowerCase();
    const { data: byUni } = await supabase
      .from("courses")
      .select("*, universities!inner(id, name, country, city)")
      .ilike("universities.name", `%${q.replace(/[%_,().*]/g, " ")}%`)
      .limit(100);
    const extra = ((byUni ?? []) as CourseWithUni[]).filter(
      (c) => (!country || c.universities.country === country) && (!level || c.degree_level === level) && c.universities.name.toLowerCase().includes(needle)
    );
    const seen = new Set(courses.map((c) => c.id));
    courses = [...courses, ...extra.filter((c) => !seen.has(c.id))];
  }
  if (showSaved) courses = courses.filter((c) => savedCourses.has(c.id));

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Find universities & courses"
        intro="Programmes listed here were published by GlobalPath from official university sources. Always confirm current requirements and deadlines on the official page before applying."
      />

      <Alert tone="info">
        Listing a programme does not mean GlobalPath has a partnership with the university or can submit applications to it or to uni-assist on your behalf.
      </Alert>

      <Card>
        <form className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end" role="search">
          <div>
            <label htmlFor="q" className={labelClass}>Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 mt-[3px] h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
              <input id="q" name="q" defaultValue={q} placeholder="Course, subject or university" className={`${inputClass} pl-9`} />
            </div>
          </div>
          <div>
            <label htmlFor="country" className={labelClass}>Country</label>
            <select id="country" name="country" defaultValue={country} className={inputClass}>
              <option value="">All countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="level" className={labelClass}>Degree level</label>
            <select id="level" name="level" defaultValue={level} className={inputClass}>
              <option value="">All levels</option>
              {Object.entries(degreeLevels).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className={buttonClass.navy}>Search</button>
            <Link href={showSaved ? "/portal/universities" : "/portal/universities?saved=1"} className={buttonClass.secondary}>
              {showSaved ? "All" : `Shortlist (${savedCourses.size})`}
            </Link>
          </div>
        </form>
      </Card>

      {universities.length === 0 ? (
        <EmptyState title="No verified programmes have been published yet">
          GlobalPath publishes programmes only after checking them against official sources. Meanwhile, you can{" "}
          <Link href="/book-consultation" className={buttonClass.link}>request a consultation</Link> to discuss options.
        </EmptyState>
      ) : courses.length === 0 ? (
        <EmptyState title="No programmes match your search">Try a different subject, country or degree level.</EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {courses.map((c) => {
            const saved = savedCourses.has(c.id);
            return (
              <li key={c.id} className="flex flex-col rounded-2xl bg-white p-5 shadow-card ring-1 ring-line">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge tone="info">{degreeLevels[c.degree_level]}</Badge>
                    <h2 className="mt-2 font-display text-lg font-semibold text-ink">{c.name}</h2>
                    <p className="text-sm text-ink-muted">
                      {c.universities.name} · {[c.universities.city, c.universities.country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <form action={toggleShortlistAction}>
                    <input type="hidden" name="course_id" value={c.id} />
                    <input type="hidden" name="saved" value={saved ? "1" : "0"} />
                    <button type="submit" className="grid h-10 w-10 place-items-center rounded-full text-navy hover:bg-navy-soft" aria-label={saved ? `Remove ${c.name} from shortlist` : `Save ${c.name} to shortlist`} aria-pressed={saved}>
                      {saved ? <BookmarkCheck className="h-5 w-5 text-brandorange" /> : <Bookmark className="h-5 w-5" />}
                    </button>
                  </form>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {c.field_of_study && (<><dt className="text-ink-faint">Subject</dt><dd className="text-ink">{c.field_of_study}</dd></>)}
                  {c.language_of_instruction && (<><dt className="text-ink-faint">Language</dt><dd className="text-ink">{c.language_of_instruction}</dd></>)}
                  {c.duration && (<><dt className="text-ink-faint">Duration</dt><dd className="text-ink">{c.duration}</dd></>)}
                  {c.intake && (<><dt className="text-ink-faint">Intake</dt><dd className="text-ink">{c.intake}</dd></>)}
                  {c.application_route && (<><dt className="text-ink-faint">Applies via</dt><dd className="text-ink">{c.application_route}</dd></>)}
                </dl>
                {c.requirements_summary && <p className="mt-3 text-sm text-ink-muted">{c.requirements_summary}</p>}
                <p className="mt-3 text-xs text-ink-faint">Checked against the official source on {formatDate(c.verified_on)}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <Link href={`/portal/applications/new?course=${c.id}`} className={buttonClass.primary}>Prepare application</Link>
                  <a href={c.source_url} target="_blank" rel="noopener noreferrer" className={buttonClass.secondary}>
                    Official page <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
