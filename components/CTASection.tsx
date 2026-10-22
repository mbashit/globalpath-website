import { ButtonLink } from "./Button";
import { WhatsAppGlyph } from "./SocialIcons";
import { whatsappLink } from "@/lib/whatsapp";

export function CTASection({
  title = "Ready to start your journey?",
  text = "Speak with our team and understand the next steps for your education, visa or relocation plans.",
  whatsappMessage,
}: {
  title?: string;
  text?: string;
  whatsappMessage?: string;
}) {
  return (
    <section className="bg-canvas py-16 md:py-24">
      <div className="container">
        <div className="relative overflow-hidden rounded-[2rem] bg-navy px-6 py-14 text-white md:px-16 md:py-20">
          <svg className="pointer-events-none absolute inset-0 hidden h-full w-full md:block" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <circle cx="720" cy="40" r="180" fill="#F7941D" opacity=".9" />
            <circle cx="760" cy="330" r="120" fill="#FDBE18" opacity=".85" />
            <path d="M0 330 C 200 300, 380 380, 560 250" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="2" strokeDasharray="4 10" />
          </svg>
          <div className="relative max-w-xl">
            <h2 className="font-display text-[2.1rem] font-bold leading-[1.05] md:text-[3.2rem]">{title}</h2>
            <p className="mt-5 text-lg text-white/80">{text}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/book-consultation">Request a Consultation</ButtonLink>
              <ButtonLink href={whatsappLink(whatsappMessage)} variant="whatsapp" external>
                <WhatsAppGlyph /> Chat on WhatsApp
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
