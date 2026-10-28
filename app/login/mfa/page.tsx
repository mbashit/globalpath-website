import type { Metadata } from "next";
import { AuthShell } from "@/components/portal/AuthShell";
import { MfaPanel } from "@/components/portal/MfaPanel";
import { requireUser } from "@/lib/portal/auth";
import { safeNext } from "@/lib/portal/validation";

export const metadata: Metadata = {
  title: "Two-Step Verification",
  description: "Verify your sign-in with your authenticator app.",
  robots: { index: false, follow: false },
};

export default async function MfaPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  await requireUser(`/login/mfa?next=${encodeURIComponent(next)}`);
  return (
    <AuthShell title="Two-step verification">
      <MfaPanel mode="challenge" next={next} />
    </AuthShell>
  );
}
