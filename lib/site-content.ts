import "server-only";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { images as builtInImages } from "@/data/images";
import { destinations as builtInDestinations, type Destination } from "@/data/destinations";
import { publishedTestimonials as builtInTestimonials, type Testimonial } from "@/data/testimonials";
import { isPortalConfigured, supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";

/**
 * Website content that administrators can edit in /admin (photos and
 * testimonials). Public pages read it through this module; whenever
 * Supabase is not configured or cannot be reached, the built-in content in
 * data/*.ts is used, so the public site never depends on the database.
 */

export const SITE_CONTENT_TAG = "site-content";
export const SITE_MEDIA_BUCKET = "site-media";

export type PhotoSlot = { key: string; label: string; where: string; src: string; alt: string };
type ImageKey = keyof typeof builtInImages;

const pageSlots: { key: ImageKey; label: string; where: string }[] = [
  { key: "hero", label: "Homepage hero", where: "Top of the homepage, inside the route card" },
  { key: "consultation", label: "Guidance", where: "Homepage, \"What our guidance focuses on\"" },
  { key: "fundsGuidance", label: "Proof of funds", where: "Homepage and the Proof of Funds page" },
  { key: "about", label: "About", where: "About page" },
  { key: "documents", label: "Document services", where: "Document Services page" },
  { key: "graduation", label: "Study abroad", where: "Study Abroad page" },
];

const slotKey = (k: string) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** Every photo slot with its built-in default, in the order shown to administrators. */
export const photoSlots: PhotoSlot[] = [
  ...pageSlots.map((s) => ({ key: slotKey(s.key), label: s.label, where: s.where, ...builtInImages[s.key] })),
  ...builtInDestinations.map((d) => ({
    key: `destination-${d.slug}`,
    label: d.name,
    where: `Destination card and the ${d.name} page`,
    src: d.image,
    alt: d.imageAlt,
  })),
];

type Content = { images: Record<string, { src: string; alt: string }>; testimonials: Testimonial[] };

const load = unstable_cache(
  async (): Promise<Content> => {
    const db = createClient(supabaseUrl, supabasePublishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const [imgs, stories] = await Promise.all([
      db.from("site_images").select("key, src, alt"),
      db
        .from("site_testimonials")
        .select("id, quote, name, context, destination, image_src, image_alt")
        .eq("status", "published")
        .order("sort_order")
        .order("id"),
    ]);
    // Throwing keeps a failed read out of the cache; the caller falls back.
    if (imgs.error) throw imgs.error;
    if (stories.error) throw stories.error;
    return {
      images: Object.fromEntries((imgs.data ?? []).map((r) => [r.key, { src: r.src, alt: r.alt }])),
      testimonials: (stories.data ?? []).map((r) => ({
        id: r.id,
        quote: r.quote,
        name: r.name,
        context: r.context,
        destination: r.destination,
        image: r.image_src ?? "",
        imageAlt: r.image_alt ?? "",
        approved: true,
      })),
    };
  },
  ["site-content-v1"],
  { tags: [SITE_CONTENT_TAG], revalidate: 600 }
);

async function content(): Promise<Content | null> {
  if (!isPortalConfigured) return null;
  try {
    return await load();
  } catch {
    return null;
  }
}

/** Page photos (hero, about, …) with any administrator replacements applied. */
export async function getSiteImages(): Promise<typeof builtInImages> {
  const c = await content();
  const out = { ...builtInImages };
  for (const k of Object.keys(out) as ImageKey[]) {
    const o = c?.images[slotKey(k)];
    if (o) out[k] = o;
  }
  return out;
}

/** Destinations with any replaced card/page photos. */
export async function getDestinations(): Promise<Destination[]> {
  const c = await content();
  return builtInDestinations.map((d) => {
    const o = c?.images[`destination-${d.slug}`];
    return o ? { ...d, image: o.src, imageAlt: o.alt } : d;
  });
}

/** Published testimonials, in the order administrators set. */
export async function getTestimonials(): Promise<Testimonial[]> {
  const c = await content();
  return c ? c.testimonials : builtInTestimonials;
}
