import { siteConfig } from "@/data/site";
import { whatsappLink } from "@/lib/whatsapp";

export function WhatsAppGlyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.24-8.24 8.24Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}

// Footer order follows this object: Facebook, X, Instagram, TikTok.
const paths = {
  facebook:
    "M13.5 21.9v-7.5h2.5l.4-2.9h-2.9V9.6c0-.8.2-1.4 1.4-1.4h1.6V5.6c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.1H7.8v2.9h2.6v7.5h3.1Z",
  x: "M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3Zm-1.08 16.18h1.7L7.4 4.73H5.58l11.09 14.45Z",
  instagram:
    "M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 4.9a4.9 4.9 0 1 0 0 9.8 4.9 4.9 0 0 0 0-9.8Zm0 8.1a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Zm5.1-9.4a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3Z",
  tiktok:
    "M16.6 5.8a4.3 4.3 0 0 1-1-2.8h-3.1v12.4a2.6 2.6 0 1 1-1.8-2.5V9.8a5.7 5.7 0 1 0 4.9 5.6V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.3-1.6Z",
};

export function SocialLinks({ className = "" }: { className?: string }) {
  // Facebook, X and Instagram always show; without a URL they are a non-clickable "coming soon" placeholder.
  const alwaysShown = new Set(["facebook", "x", "instagram"]);
  const entries = (Object.keys(paths) as (keyof typeof paths)[])
    .map((k) => ({ key: k, url: siteConfig.social[k] }))
    .filter((e) => e.url || alwaysShown.has(e.key));
  const labels = { facebook: "Facebook", x: "X", instagram: "Instagram", tiktok: "TikTok" };
  const base =
    "grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-brandorange hover:text-navy-ink";
  const icon = (key: keyof typeof paths) => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d={paths[key]} />
    </svg>
  );
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {entries.map((e) => (
        <li key={e.key}>
          {e.url ? (
            <a href={e.url} target="_blank" rel="noopener noreferrer" aria-label={`GlobalPath on ${labels[e.key]}`} className={base}>
              {icon(e.key)}
            </a>
          ) : (
            <span role="img" aria-label={`${labels[e.key]} (coming soon)`} title={`${labels[e.key]}: coming soon`} className="grid h-11 w-11 cursor-default place-items-center rounded-full bg-white/10 text-white/60">
              {icon(e.key)}
            </span>
          )}
        </li>
      ))}
      <li>
        <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className={base}>
          <WhatsAppGlyph />
        </a>
      </li>
    </ul>
  );
}
