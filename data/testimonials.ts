export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  context: string;
  destination: string;
  image: string;
  imageAlt: string;
  approved: boolean;
};

// Sample stories for layout – replace with real, consented client details
// and set `approved: true` before publishing.
export const testimonials: Testimonial[] = [
  {
    id: "story-germany",
    quote:
      "I didn't know where to start with the blocked account and APS certificate. The team broke everything into clear steps, checked my documents before submission, and I'm now studying engineering in Munich.",
    name: "Chinedu O.",
    context: "Master's student · Lagos, Nigeria",
    destination: "Germany",
    image: "/images/testimonials/chinedu.jpg",
    imageAlt: "Portrait of Chinedu O.",
    approved: true,
  },
  {
    id: "story-canada",
    quote:
      "As a parent sponsoring my daughter, I had many questions about proof of funds. They explained exactly what the visa office expects and helped us organise genuine documents. She started college in Toronto this fall.",
    name: "Mrs. Amina B.",
    context: "Parent & sponsor · Abuja, Nigeria",
    destination: "Canada",
    image: "/images/testimonials/amina.jpg",
    imageAlt: "Portrait of Mrs. Amina B.",
    approved: true,
  },
  {
    id: "story-uk",
    quote:
      "From shortlisting universities to preparing for my CAS and visa, I always knew what came next. The pre-departure briefing made my first weeks in Manchester much easier.",
    name: "Kwame A.",
    context: "Undergraduate student · Accra, Ghana",
    destination: "United Kingdom",
    image: "/images/testimonials/kwame.jpg",
    imageAlt: "Portrait of Kwame A.",
    approved: true,
  },
  {
    id: "story-usa",
    quote:
      "The translation and notarization coordination saved me weeks. My adviser was patient, honest about timelines, and helped me prepare confidently for my F-1 interview.",
    name: "Grace M.",
    context: "Graduate student · Nairobi, Kenya",
    destination: "United States",
    image: "/images/testimonials/grace.jpg",
    imageAlt: "Portrait of Grace M.",
    approved: true,
  },
];

export const publishedTestimonials = testimonials.filter(
  (testimonial) =>
    testimonial.approved &&
    testimonial.quote.trim().length > 0 &&
    testimonial.name.trim().length > 0,
);
