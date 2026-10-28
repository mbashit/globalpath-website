import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/portal/AuthShell";
import { SignUpForm } from "@/components/portal/AuthForms";

export const metadata: Metadata = {
  title: "Create a Student Account",
  description: "Create a GlobalPath student portal account to manage your academic profile, documents and application preparation.",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your student account"
      intro={
        <>
          Optional: you do not need an account to <Link href="/book-consultation" className="font-semibold text-navy underline">request a consultation</Link>.
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
