/**
 * TESTIMONIALS
 * ------------------------------------------------------------
 * Every entry below is a PLACEHOLDER. They are clearly labelled on
 * the site. Replace each one with a verified client review, and only
 * publish names/photos with the client's written consent.
 * When an entry is real, set `verified: true` and the placeholder
 * label disappears automatically.
 */
export type Testimonial = {
  verified: boolean;
  name: string; // e.g. "Chinedu O." – first name + initial is enough
  fromCountry: string;
  program: string;
  destination: string;
  quote: string;
  photo?: string; // e.g. "/images/testimonials/chinedu.jpg" (with consent)
};

export const testimonials: Testimonial[] = [
  {
    verified: false,
    name: "Client name",
    fromCountry: "Nigeria",
    program: "Master's programme",
    destination: "Germany",
    quote: "Testimonial placeholder — replace with verified client review.",
  },
  {
    verified: false,
    name: "Client name",
    fromCountry: "Ghana",
    program: "Undergraduate degree",
    destination: "Canada",
    quote: "Testimonial placeholder — replace with verified client review.",
  },
  {
    verified: false,
    name: "Parent / sponsor",
    fromCountry: "Nigeria",
    program: "Foundation + degree",
    destination: "United Kingdom",
    quote: "Testimonial placeholder — replace with verified client review.",
  },
  {
    verified: false,
    name: "Client name",
    fromCountry: "Cameroon",
    program: "Preparatory faculty + degree",
    destination: "Russia",
    quote: "Testimonial placeholder — replace with verified client review.",
  },
];
