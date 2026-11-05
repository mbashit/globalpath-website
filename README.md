# GlobalPath Education — Study Abroad & Visa Consultancy Website

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs) ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)

A production marketing website for a study-abroad and visa-support consultancy, built with the **Next.js App Router**, React 19, TypeScript and Tailwind CSS.

## Highlights

- **15+ pages** — home, services, study abroad, visa support, proof of funds, document services, destinations, success stories, FAQs, consultation booking, contact and legal pages
- **Dynamic routes** — `destinations/[slug]` generates a page per country from typed data
- **Content as data** — destinations, services, FAQs, testimonials and navigation live in typed modules under `data/`, so content updates need no component changes
- **Secure contact API** (`app/api/contact/route.ts`) — server-side validation, honeypot spam trap, rate limiting, HTTPS-only forwarding to a configurable form endpoint (e.g. Formspree or a webhook)
- **SEO** — per-page metadata helpers (`lib/seo.ts`), generated `sitemap.ts` and `robots.ts`, indexing toggle via env var
- **WhatsApp click-to-chat** integration and reusable UI kit (hero, CTA, FAQ accordion, process steps, reveal-on-scroll animations)
- Fully responsive, accessible components

## Tech stack

| Layer | Tools |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS, PostCSS |
| Icons | lucide-react |
| Quality | ESLint, `tsc --noEmit` |

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

| Script | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check |

### Environment variables

| Variable | Description |
|---|---|
| `FORM_FORWARD_URL` | HTTPS endpoint that receives contact-form submissions |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL used for SEO and the sitemap |
| `NEXT_PUBLIC_ALLOW_INDEXING` | `true` to allow search-engine indexing |

## Project structure

```
app/          # routes (App Router), API routes, sitemap, robots
components/   # reusable UI components
data/         # typed site content (destinations, services, FAQs, …)
lib/          # SEO, WhatsApp, Paystack and portal helpers
public/       # static images
tests/e2e/    # Playwright navigation and auth tests (npm run test:e2e)
```

## Forms

All forms POST to `app/api/contact/route.ts`. Set `FORM_FORWARD_URL` in Netlify
to a trusted HTTPS webhook and test delivery before accepting enquiries. If it
is unset, forms return an error and do not store or deliver submissions.
The endpoint validates each form schema and applies a best-effort in-memory
throttle; configure a durable Netlify/WAF rate limit before advertising.
Forms do not upload documents.

## Student portal

Optional student accounts (`/login`, `/signup`, `/portal`) and a staff review area
(`/admin`) run on Supabase. They stay switched off until the Supabase variables in
`.env.example` are set; the public site works the same either way. Setup, admin
provisioning and security notes: [`docs/STUDENT_PORTAL.md`](docs/STUDENT_PORTAL.md).
Database access rules are tested with `npm run test:db`.

## Booking calendar

Set `bookingEmbedUrl` in `data/site.ts` (Calendly, Cal.com, Google Calendar
appointment page) and it replaces the request form on `/book-consultation`.

## Images

`public/images` contains SVG illustrations and locally optimized Unsplash photos.
The photos are local optimized assets; source IDs are `photo-1517486808906-6ca8b3f04846`,
`photo-1522202176988-66273c2fd55f`, `photo-1524178232363-1fb2b075b655`,
`photo-1516979187457-637abb4f9353`, and `photo-1541339907198-e08756dedf3f`.
Destination photo IDs are `photo-1560969184-10fe8719e047`,
`photo-1517935706615-2717063c2225`, `photo-1513635269975-59663e0ac1ad`,
`photo-1562774053-701939374585`, and `photo-1513326738677-b964603b136d`.
Update paths and accurate alt text in `data/images.ts` when replacing them.
Regenerate `public/images/og-image.png` (1200×630) if the brand name changes.

## Deploy

The review site is linked to Netlify. From this directory, deploy manually with
`npx netlify-cli deploy --prod`. The source repository is private on GitHub at
`https://github.com/mbashit/globalpath-website`.

## Production checklist

- Confirm the registered business name, official domain, email, phone/WhatsApp, address, hours and consultation timezone.
- Configure and test `FORM_FORWARD_URL` using a trusted provider; verify a test enquiry reaches the intended recipient.
- Confirm the provider, retention period, storage region, access controls and deletion procedure; then update the Privacy Policy.
- Have the Privacy Policy, Terms and Disclaimer reviewed for the operating jurisdiction by qualified counsel.
- Confirm service scope, pricing/refund terms, translator/notary providers and credentials before making service claims.
- Replace illustrative graphics with owned or licensed photography and write accurate alternative text.
- Publish only client stories with verified details and written consent. The stories in `data/testimonials.ts` are marked as samples; confirm or replace them before launch.
- Set `NEXT_PUBLIC_SITE_URL` to the official domain and `NEXT_PUBLIC_ALLOW_INDEXING=true` only after launch approval. Keep review deploys non-indexable.
- Verify country-specific admissions and immigration content against current official sources before relying on it.
