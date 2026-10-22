# GlobalPath Education & Mobility – Website

Next.js 14 + TypeScript + Tailwind CSS. Mobile-first, WhatsApp-first.

## Run locally
```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
npm run build && npm start   # production check
```
Requires Node.js 18.17 or newer.

## Where to edit things
| What | File |
|---|---|
| Company name, phone, WhatsApp, email, address, hours, social links, booking link | `data/site.ts` |
| Menu and footer links | `data/navigation.ts` |
| Services (home cards + Services page) | `data/services.ts` |
| Destinations (add a country by copying one object) | `data/destinations.ts` |
| FAQs | `data/faqs.ts` |
| Testimonials (set `verified: true` for real ones) | `data/testimonials.ts` |
| Form fields | `data/forms.ts` |
| Image paths and alt text | `data/images.ts` + files in `public/images` |
| Colours and fonts | `tailwind.config.ts`, `app/layout.tsx` |

Search the project for `REPLACE` and `CONFIRM` to find every placeholder.

## Forms
All forms POST to `app/api/contact/route.ts`, which forwards the data as JSON to
`FORM_FORWARD_URL` (Formspree, Make.com, Zapier or your own backend).
If it is not set in production, forms show an error with a WhatsApp fallback,
so no enquiry is silently lost. Add rate limiting before running ads.

The document form does **not** upload files – only file names. See the comment
in `components/ContactForm.tsx` for what secure storage is needed first.

## Booking calendar
Set `bookingEmbedUrl` in `data/site.ts` (Calendly, Cal.com, Google Calendar
appointment page) and it replaces the request form on `/book-consultation`.

## Images
`public/images` contains branded SVG placeholders. Replace with real photos
(JPG/WebP, ~1600px wide, <300 KB) showing African students and families, and
update paths in `data/images.ts` / `data/destinations.ts`.
Also regenerate `public/images/og-image.png` (1200×630) if the brand name changes.

## Deploy
Easiest: push to GitHub and import into Vercel. Add `FORM_FORWARD_URL` and
`NEXT_PUBLIC_SITE_URL` as environment variables.

## Before launch
- Legal pages are templates – get them reviewed by a lawyer.
- Visa/funds information is general; re-check official links every few months.
- Never publish testimonials, names or photos without written consent.
