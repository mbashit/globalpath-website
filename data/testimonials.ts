export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  context: string;
  destination: string;
  approved: boolean;
};

export const testimonials: Testimonial[] = [];

export const publishedTestimonials = testimonials.filter(
  (testimonial) =>
    testimonial.approved &&
    testimonial.quote.trim().length > 0 &&
    testimonial.name.trim().length > 0,
);