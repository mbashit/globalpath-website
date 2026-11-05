"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Alert, buttonClass, inputClass, labelClass } from "./ui";

type Factor = { id: string; status: string; friendly_name?: string; factor_type: string };

/**
 * Authenticator-app (TOTP) MFA via Supabase Auth.
 * mode="challenge": verify (or first enrol) during login – required for staff.
 * mode="manage": enable/disable from Account Settings.
 */
export function MfaPanel({ mode, next = "/portal" }: { mode: "challenge" | "manage"; next?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState<Factor | null>(null);
  const [enrolment, setEnrolment] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error: e } = await supabase.auth.mfa.listFactors();
    if (e) {
      setError("Your session has expired. Please log in again.");
      setLoading(false);
      return;
    }
    const all = (data?.all ?? []) as Factor[];
    setVerified(all.find((f) => f.factor_type === "totp" && f.status === "verified") ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Loading factors needs the browser session, so it runs after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function startEnrolment() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data: list } = await supabase.auth.mfa.listFactors();
    for (const f of (list?.all ?? []) as Factor[]) {
      if (f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data, error: e } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)}` });
    setBusy(false);
    if (e || !data) return setError("Could not start set-up. Refresh the page and try again.");
    setEnrolment({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function verify(factorId: string) {
    if (!/^\d{6}$/.test(code)) return setError("Enter the 6-digit code from your authenticator app.");
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: e } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    setBusy(false);
    if (e) return setError("That code was not accepted. Check the time on your phone and try the newest code.");
    setCode("");
    setEnrolment(null);
    setDone(true);
    if (mode === "challenge") {
      router.replace(next);
      router.refresh();
    } else {
      await load();
      router.refresh();
    }
  }

  async function remove() {
    if (!verified || !window.confirm("Turn off two-step verification? Staff accounts lose access to staff tools until it is turned on again.")) return;
    setBusy(true);
    const supabase = createClient();
    const { error: e } = await supabase.auth.mfa.unenroll({ factorId: verified.id });
    setBusy(false);
    if (e) return setError("Could not turn it off. Sign out, sign in again with your code, and retry.");
    await supabase.auth.refreshSession();
    await load();
    router.refresh();
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-ink-muted">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Checking two-step verification…
      </p>
    );
  }

  const codeInput = (factorId: string) => (
    <form
      className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        void verify(factorId);
      }}
    >
      <div className="sm:w-56">
        <label htmlFor="mfa-code" className={labelClass}>6-digit code</label>
        <input id="mfa-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className={inputClass} />
      </div>
      <button type="submit" disabled={busy} className={buttonClass.primary}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Verify
      </button>
    </form>
  );

  return (
    <div>
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      {done && mode === "manage" && <Alert tone="success" className="mb-4">Two-step verification is on.</Alert>}

      {verified && !enrolment ? (
        mode === "challenge" ? (
          <>
            <p className="text-ink-muted">Open your authenticator app and enter the current code for GlobalPath.</p>
            {codeInput(verified.id)}
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 font-semibold text-[#11643A]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" /> Two-step verification is on
            </p>
            <button type="button" onClick={remove} disabled={busy} className={buttonClass.danger}>Turn off</button>
          </div>
        )
      ) : enrolment ? (
        <div>
          <ol className="list-decimal space-y-2 pl-5 text-ink-muted">
            <li>Install an authenticator app (for example Google Authenticator, Microsoft Authenticator or 1Password).</li>
            <li>Scan this QR code, or enter the set-up key manually.</li>
            <li>Enter the 6-digit code the app shows.</li>
          </ol>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- data: URL SVG from Supabase */}
            <img src={enrolment.qr} alt="QR code for your authenticator app" className="h-44 w-44 rounded-xl bg-white p-2 ring-1 ring-line" />
            <p className="text-sm text-ink-muted">
              Set-up key:
              <code className="mt-1 block break-all rounded-lg bg-canvas px-3 py-2 font-mono text-ink">{enrolment.secret}</code>
            </p>
          </div>
          {codeInput(enrolment.id)}
        </div>
      ) : (
        <div>
          <p className="text-ink-muted">
            {mode === "challenge"
              ? "GlobalPath staff accounts must use two-step verification with an authenticator app before accessing student records."
              : "Add a second step at sign-in using an authenticator app on your phone."}
          </p>
          <button type="button" onClick={startEnrolment} disabled={busy} className={`${buttonClass.navy} mt-4`}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Set up authenticator app
          </button>
        </div>
      )}
    </div>
  );
}
