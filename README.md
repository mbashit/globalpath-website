# GlobalPath — Study Abroad & Visa Consultancy Website

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
app/          # routes (App Router), API route, sitemap, robots
components/   # reusable UI components
data/         # typed site content (destinations, services, FAQs, …)
lib/          # SEO, WhatsApp and class-name helpers
public/       # static images
```
