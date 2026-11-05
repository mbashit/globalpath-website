import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/portal/AuthShell";
import { ResetPasswordForm } from "@/components/portal/AuthForms";
import { Alert, buttonClass } from "@/components/portal/ui";
import { getSession } from "@/lib/portal/auth";

export const metadata: Metadata = {
  title: "Choose a New Password",
  description: "Set a new password for your GlobalPath student portal.",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  const { user } = await getSession();
  return (
    <AuthShell title="Choose a new password">
      {user ? (
        <ResetPasswordForm />
      ) : (
        <Alert tone="warn" title="Reset link required">
          Open the password reset link from your email to continue, or{" "}
          <Link href="/forgot-password" className={buttonClass.link}>request a new link</Link>.
        </Alert>
      )}
    </AuthShell>
  );
}
