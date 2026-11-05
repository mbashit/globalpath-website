import Link from "next/link";
import { ClipboardCheck, FileStack, FolderLock, GraduationCap } from "lucide-react";
import { Section, SectionHeading } from "./Section";
import { ButtonLink } from "./Button";
import { isPortalConfigured } from "@/lib/supabase/config";

const capabilities = [
  { title: "Academic Profile", text: "Keep your personal details and educational history in one place.", icon: GraduationCap },
  { title: "Secure Document Uploads", text: "Upload certificates and transcripts to a private, access-controlled area.", icon: FolderLock },
  { title: "Document Review", text: "See when our team has reviewed a document, or what needs correcting.", icon: ClipboardCheck },
  { title: "Application Tracking", text: "Follow the preparation status of the programmes you are applying to.", icon: FileStack },
];

/**
 * Homepage introduction to the optional student portal. Hidden until the
 * portal is configured, so it never links to an unavailable sign-up.
 */
export function StudentPortalSection() {
  if (!isPortalConfigured) return null;
  return (
    <Section tone="canvas" id="student-portal">
      <div className="grid gap-10 rounded-[2rem] bg-white p-6 ring-1 ring-line md:p-12 lg:grid-cols-[1fr_1.3fr] lg:items-center lg:gap-14">
        <div>
          <SectionHeading
            title="Your Study Abroad Journey, All in One Place"
            intro="Create your GlobalPath student account to manage your academic profile, upload documents securely, track internal document reviews, and follow your application preparation."
          />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/signup">Create Student Account</ButtonLink>
            <p className="text-ink-muted">
              Already registered?{" "}
              <Link href="/login" className="font-semibold text-navy underline decoration-brandorange decoration-2 underline-offset-[6px]">Log in</Link>
            </p>
          </div>
          <p className="mt-5 text-sm text-ink-faint">An account is optional. You can request a consultation without one.</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {capabilities.map(({ title, text, icon: Icon }) => (
            <li key={title} className="rounded-2xl border border-line p-5">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-navy-soft text-navy">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-1 text-[0.95rem] text-ink-muted">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
