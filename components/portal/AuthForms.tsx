"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { forgotPasswordAction, resendVerificationAction, resetPasswordAction, signInAction, signUpAction } from "@/app/auth/actions";
import { Alert, Field, buttonClass } from "./ui";
import { FormResult, PasswordInput, SubmitButton } from "./forms";
import { cn } from "@/lib/cn";

export function SignUpForm({ next = "" }: { next?: string }) {
  const [state, action] = useActionState(signUpAction, null);
  const fe = state?.fieldErrors ?? {};

  if (state?.ok) {
    return (
      <div className="text-center">
        <MailCheck className="mx-auto h-12 w-12 text-[#1FAF55]" aria-hidden="true" />
        <h2 className="mt-4 font-display text-2xl font-bold text-ink">Check your email</h2>
        <p className="mx-auto mt-2 max-w-md text-ink-muted">
          If <strong className="text-ink">{state.message}</strong> can be registered, we sent a verification link to it. Open the link to activate your account, then sign in.
        </p>
        <ResendVerification email={state.message ?? ""} />
      </div>
    );
  }

  return (
    <form action={action} noValidate className="grid gap-5 sm:grid-cols-2">
      <input type="hidden" name="next" value={next} />
      <Field label="First name" name="firstName" autoComplete="given-name" required error={fe.firstName} />
      <Field label="Last name" name="lastName" autoComplete="family-name" required error={fe.lastName} />
      <Field label="Email" name="email" type="email" autoComplete="email" required error={fe.email} className="sm:col-span-2" />
      <div className="sm:col-span-2">
        <PasswordInput name="password" label="Password" autoComplete="new-password" showStrength emailFieldName="email" error={fe.password} />
      </div>
      <div className="sm:col-span-2">
        <PasswordInput name="confirmPassword" label="Confirm password" autoComplete="new-password" error={fe.confirmPassword} />
      </div>
      <div className="sm:col-span-2">
        <label className="flex items-start gap-3 text-[0.95rem] text-ink-muted">
          <input type="checkbox" name="acceptTerms" className="mt-1 h-5 w-5 shrink-0 rounded border-line accent-[#252B83]" aria-invalid={fe.acceptTerms ? true : undefined} />
          <span>
            I have read and accept the{" "}
            <Link href="/privacy-policy" className="font-semibold text-navy underline underline-offset-2" target="_blank">Privacy Policy</Link> and{" "}
            <Link href="/terms" className="font-semibold text-navy underline underline-offset-2" target="_blank">Terms &amp; Conditions</Link>.
          </span>
        </label>
        {fe.acceptTerms && <p className="mt-1.5 text-sm font-medium text-[#C8341B]">{fe.acceptTerms}</p>}
      </div>
      <div className="sm:col-span-2">
        <FormResult state={state} />
      </div>
      <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <SubmitButton pendingText="Creating account…">Create account</SubmitButton>
        <p className="text-sm text-ink-muted">
          Already registered? <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className={buttonClass.link}>Log in</Link>
        </p>
      </div>
    </form>
  );
}

function ResendVerification({ email }: { email: string }) {
  const [state, action] = useActionState(resendVerificationAction, null);
  return (
    <form action={action} className="mt-6 grid justify-items-center gap-3">
      <input type="hidden" name="email" value={email} />
      <SubmitButton variant="secondary" pendingText="Sending…">Resend verification email</SubmitButton>
      <FormResult state={state} />
    </form>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(signInAction, null);
  const unverified = state?.error === "unverified";
  return (
    <div className="grid gap-6">
      <form action={action} noValidate className="grid gap-5">
        <input type="hidden" name="next" value={next} />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <PasswordInput name="password" label="Password" autoComplete="current-password" />
        <div className="flex justify-end">
          <Link href="/forgot-password" className={cn(buttonClass.link, "text-sm")}>Forgot your password?</Link>
        </div>
        {!unverified && <FormResult state={state} />}
        <SubmitButton pendingText="Signing in…" className="w-full sm:w-auto">Log in</SubmitButton>
      </form>
      {unverified && (
        <div className="grid gap-3">
          <Alert tone="warn" title="Verify your email first">
            Your account is not active yet. Open the verification link we emailed to {state?.message}, or request a new one.
          </Alert>
          <ResendVerification email={state?.message ?? ""} />
        </div>
      )}
    </div>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, null);
  return (
    <form action={action} noValidate className="grid gap-5">
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <FormResult state={state} />
      <SubmitButton pendingText="Sending…" className="w-full sm:w-auto">Send reset link</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState(resetPasswordAction, null);
  return (
    <form action={action} noValidate className="grid gap-5">
      <PasswordInput name="password" label="New password" autoComplete="new-password" showStrength />
      <PasswordInput name="confirmPassword" label="Confirm new password" autoComplete="new-password" />
      <FormResult state={state} />
      <SubmitButton pendingText="Updating…" className="w-full sm:w-auto">Update password</SubmitButton>
    </form>
  );
}
