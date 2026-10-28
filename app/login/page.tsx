import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/portal/AuthShell";
import { LoginForm } from "@/components/portal/AuthForms";
import { Alert, buttonClass } from "@/components/portal/ui";
import { safeNext } from "@/lib/portal/validation";

export const metadata: Metadata = {
  title: "Student Portal Login",
  description: "Log in to your GlobalPath student portal.",
  robots: { index: false, follow: false },
};

const notices: Record<string, { tone: "success" | "info" | "warn" | "danger"; text: string }> = {
  "signed-out": { tone: "success", text: "You have signed out." },
  expired: { tone: "warn", text: "Your session expired. Please log in again." },
  link: { tone: "danger", text: "That link is invalid or has expired. Request a new verification or password reset email." },
  unavailable: { tone: "warn", text: "The student portal is not available yet." },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next, "");
  const notice = notices[sp.notice ?? ""] ?? notices[sp.reason ?? ""] ?? notices[sp.error ?? ""];
  return (
    <AuthShell title="Log in to your portal" intro="Access your profile, documents and application preparation.">
      {notice && <Alert tone={notice.tone} className="mb-6">{notice.text}</Alert>}
      <LoginForm next={next} />
      <p className="mt-8 border-t border-line pt-6 text-sm text-ink-muted">
        New to GlobalPath? <Link href="/signup" className={buttonClass.link}>Create an account</Link>
      </p>
    </AuthShell>
  );
}
