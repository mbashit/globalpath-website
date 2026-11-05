"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPortalConfigured } from "@/lib/supabase/config";
import { rateLimited } from "@/lib/portal/rate-limit";
import { emailRe, passwordIssues, safeNext, str } from "@/lib/portal/validation";
import type { ActionState } from "@/lib/portal/types";
import { siteConfig } from "@/data/site";

const notConfigured: ActionState = { error: "The student portal is not available yet. Please contact GlobalPath directly." };
const confirmUrl = (next: string) => `${siteConfig.url}/auth/confirm?next=${encodeURIComponent(next)}`;

export async function signUpAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  if (!isPortalConfigured) return notConfigured;
  if (await rateLimited("signup", 5, 10 * 60_000)) return { error: "Too many attempts. Please wait a few minutes and try again." };

  const firstName = str(form, "firstName", 100);
  const lastName = str(form, "lastName", 100);
  const email = str(form, "email", 254).toLowerCase();
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirmPassword") ?? "");
  const accepted = form.get("acceptTerms") === "on";
  // Where the verification link lands: the protected page the visitor was heading to, if any.
  const next = safeNext(form.get("next"));

  const fieldErrors: Record<string, string> = {};
  if (!firstName) fieldErrors.firstName = "Enter your first name";
  if (!lastName) fieldErrors.lastName = "Enter your last name";
  if (!emailRe.test(email)) fieldErrors.email = "Enter a valid email address";
  const issues = passwordIssues(password, email);
  if (issues.length) fieldErrors.password = `Password needs ${issues.join(", ")}`;
  if (password !== confirm) fieldErrors.confirmPassword = "Passwords do not match";
  if (!accepted) fieldErrors.acceptTerms = "You must accept the Privacy Policy and Terms to create an account";
  if (Object.keys(fieldErrors).length) return { error: "Please correct the highlighted fields.", fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: confirmUrl(next),
      data: { first_name: firstName, last_name: lastName, accepted_terms: "true" },
    },
  });
  if (error) {
    if (error.code === "weak_password") return { error: "Choose a stronger password.", fieldErrors: { password: error.message } };
    if (error.status === 429) return { error: "Too many attempts. Please wait a few minutes and try again." };
    // Do not reveal whether an email address is already registered.
    if (error.code !== "user_already_exists") return { error: "We could not create your account. Please try again." };
  }
  return { ok: true, message: email };
}

export async function signInAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  if (!isPortalConfigured) return notConfigured;
  if (await rateLimited("login", 10, 10 * 60_000)) return { error: "Too many sign-in attempts. Please wait a few minutes and try again." };

  const email = str(form, "email", 254).toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = safeNext(form.get("next"), "");
  if (!emailRe.test(email) || !password) return { error: "Enter your email address and password." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed") return { error: "unverified", message: email };
    if (error.status === 429) return { error: "Too many sign-in attempts. Please wait a few minutes and try again." };
    return { error: "The email address or password is incorrect." };
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const { data: staff } = await supabase.from("staff_roles").select("role").eq("user_id", data.user.id).maybeSingle();
  const destination = next || (staff ? "/admin" : "/portal");
  if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
    redirect(`/login/mfa?next=${encodeURIComponent(destination)}`);
  }
  redirect(destination);
}

export async function resendVerificationAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  if (!isPortalConfigured) return notConfigured;
  if (await rateLimited("resend", 3, 10 * 60_000)) return { error: "Please wait a few minutes before requesting another email." };
  const email = str(form, "email", 254).toLowerCase();
  if (!emailRe.test(email)) return { error: "Enter a valid email address." };
  const supabase = await createClient();
  await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: confirmUrl("/portal") } });
  return { ok: true, message: "If that account is waiting for verification, we sent a new link. Check your inbox and spam folder." };
}

export async function forgotPasswordAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  if (!isPortalConfigured) return notConfigured;
  if (await rateLimited("forgot", 3, 10 * 60_000)) return { error: "Please wait a few minutes before requesting another email." };
  const email = str(form, "email", 254).toLowerCase();
  if (!emailRe.test(email)) return { error: "Enter a valid email address." };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: confirmUrl("/reset-password") });
  // Same response whether or not the account exists.
  return { ok: true, message: "If an account exists for that email, we sent a password reset link. It expires after one hour." };
}

export async function resetPasswordAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  if (!isPortalConfigured) return notConfigured;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Your reset link has expired. Request a new one." };

  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirmPassword") ?? "");
  const issues = passwordIssues(password, data.user.email ?? "");
  if (issues.length) return { error: `Password needs ${issues.join(", ")}.` };
  if (password !== confirm) return { error: "Passwords do not match." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") return { error: "Choose a password you have not used for this account." };
    if (error.code === "reauthentication_needed" || error.code === "insufficient_aal") {
      return { error: "For security, sign in again (including your authenticator code if enabled) and then change your password in Account Settings." };
    }
    return { error: "We could not update your password. Request a new reset link and try again." };
  }
  redirect("/portal?notice=password-updated");
}

export async function signOutAction() {
  if (isPortalConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login?notice=signed-out");
}
