import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/portal/AuthShell";
import { SignUpForm } from "@/components/portal/AuthForms";
import { safeNext } from "@/lib/portal/validation";

export const metadata: Metadata = {
  title: "Create a Student Account",
  description: "Create a GlobalPath student portal account to manage your academic profile, documents and application preparation.",
  robots: { index: false, follow: false },
};

export default async function SignUpPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const next = safeNext((await searchParams).next, "");
  return (
    <AuthShell
      title="Create your student account"
      intro={
        <>
          Optional: you do not need an account to <Link href="/book-consultation" className="font-semibold text-navy underline">request a consultation</Link>.
        </>
      }
    >
      <SignUpForm next={next} />
    </AuthShell>
  );
}
