import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/portal/AuthShell";
import { ForgotPasswordForm } from "@/components/portal/AuthForms";
import { buttonClass } from "@/components/portal/ui";

export const metadata: Metadata = {
  title: "Reset Your Password",
  description: "Request a password reset link for your GlobalPath student portal.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Forgot your password?" intro="Enter your account email and we will send you a link to choose a new password.">
      <ForgotPasswordForm />
      <p className="mt-8 border-t border-line pt-6 text-sm text-ink-muted">
        Remembered it? <Link href="/login" className={buttonClass.link}>Back to login</Link>
      </p>
    </AuthShell>
  );
}
