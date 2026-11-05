"use client";

import { useActionState, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { passwordIssues, passwordScore } from "@/lib/portal/validation";
import type { ActionState } from "@/lib/portal/types";
import { Alert, buttonClass, inputClass, labelClass } from "./ui";

export function SubmitButton({ children, pendingText, variant = "primary", className }: { children: ReactNode; pendingText?: string; variant?: keyof typeof buttonClass; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={cn(buttonClass[variant], className)}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {pending ? pendingText ?? "Saving…" : children}
    </button>
  );
}

export function FormResult({ state }: { state: ActionState }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state?.error || state?.message) ref.current?.focus();
  }, [state]);
  if (!state || (!state.error && !state.message)) return null;
  return (
    <div ref={ref} tabIndex={-1} className="outline-none">
      <Alert tone={state.error ? "danger" : "success"}>{state.error ?? state.message}</Alert>
    </div>
  );
}

/**
 * A form bound to a server action with inline success/error feedback.
 * Children may be a function receiving the latest state (for field errors).
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  children: ReactNode | ((state: ActionState) => ReactNode);
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnSuccess && state?.ok) formRef.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={formRef} action={formAction} className={className} noValidate>
      {typeof children === "function" ? children(state) : children}
      <div className="mt-4 empty:hidden sm:col-span-full">
        <FormResult state={state} />
      </div>
    </form>
  );
}

export function PasswordInput({
  name,
  label,
  autoComplete,
  showStrength = false,
  emailFieldName,
  error,
}: {
  name: string;
  label: string;
  autoComplete: string;
  showStrength?: boolean;
  emailFieldName?: string;
  error?: string;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const [email, setEmail] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!emailFieldName) return;
    const form = inputRef.current?.form;
    const el = form?.elements.namedItem(emailFieldName) as HTMLInputElement | null;
    if (!el) return;
    const sync = () => setEmail(el.value);
    el.addEventListener("input", sync);
    return () => el.removeEventListener("input", sync);
  }, [emailFieldName]);

  const score = passwordScore(value);
  const issues = passwordIssues(value, email);
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-help`}
          className={cn(inputClass, "pr-12")}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 mt-[3px] grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-ink-muted hover:bg-canvas"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <div id={`${id}-help`}>
        {showStrength && value && (
          <div className="mt-2">
            <div className="flex gap-1" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < score ? (score >= 3 ? "bg-[#1FAF55]" : "bg-brandorange") : "bg-line")} />
              ))}
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              Strength: <span className="font-semibold">{labels[score]}</span>
              {issues.length > 0 && <> · Needs {issues.join(", ")}</>}
            </p>
          </div>
        )}
        {showStrength && !value && <p className="mt-1 text-sm text-ink-faint">At least 10 characters with upper and lowercase letters and a number.</p>}
        {error && <p className="mt-1 text-sm font-medium text-[#C8341B]">{error}</p>}
      </div>
    </div>
  );
}

/** Button that asks for confirmation before submitting its form. */
export function ConfirmSubmit({ children, message, variant = "danger", className }: { children: ReactNode; message: string; variant?: keyof typeof buttonClass; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(buttonClass[variant], className)}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
