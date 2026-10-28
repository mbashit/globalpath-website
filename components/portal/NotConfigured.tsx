import Link from "next/link";
import { Alert, buttonClass } from "./ui";

/** Shown in /portal and /admin until Supabase environment variables are set. */
export function NotConfigured() {
  return (
    <div className="container max-w-2xl py-20">
      <Alert tone="warn" title="The student portal is not available yet">
        GlobalPath is still setting up secure accounts and document storage. You can continue to use the website and request a consultation.
      </Alert>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/book-consultation" className={buttonClass.primary}>Request a consultation</Link>
        <Link href="/" className={buttonClass.secondary}>Back to the website</Link>
      </div>
    </div>
  );
}
