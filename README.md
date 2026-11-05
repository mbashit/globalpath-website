# GlobalPath Education – Website

Next.js 16 + React 19 + TypeScript + Tailwind CSS. The site supports study-abroad enquiries and consultation requests.

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
npm run build && npm start   # production check
```

Requires Node.js 20.9 or newer.

## Where to edit things

| What                                                                             | File                                        |
| -------------------------------------------------------------------------------- | ------------------------------------------- |
| Company name, phone, WhatsApp, email, address, hours, social links, booking link | `data/site.ts`                              |
| Menu and footer links                                                            | `data/navigation.ts`                        |
| Services (home cards + Services page)                                            | `data/services.ts`                          |
| Destinations (add a country by copying one object)                               | `data/destinations.ts`                      |
| FAQs                                                                             | `data/faqs.ts`                              |
| Testimonials (only approved, complete entries render)                            | `data/testimonials.ts`                      |
| Form fields                                                                      | `data/forms.ts`                             |
| Image paths and alt text                                                         | `data/images.ts` + files in `public/images` |
| Colours and fonts                                                                | `tailwind.config.ts`, `app/layout.tsx`      |

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
- Publish only client stories with verified details and written consent; currently no testimonials are displayed.
- Set `NEXT_PUBLIC_SITE_URL` to the official domain and `NEXT_PUBLIC_ALLOW_INDEXING=true` only after launch approval. Keep review deploys non-indexable.
- Verify country-specific admissions and immigration content against current official sources before relying on it.
