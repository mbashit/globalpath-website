import { ButtonLink } from "./Button";
import { WhatsAppGlyph } from "./SocialIcons";
import { whatsappLink } from "@/lib/whatsapp";

export function CTASection({
  title = "Ready to start your journey?",
  text = "Speak with our team and understand the next steps for your studies, visa or travel plans.",
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
          {/* The route line from the hero, ending at the destination */}
          <svg className="pointer-events-none absolute inset-0 hidden h-full w-full md:block" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <path d="M0 350 C 220 320, 420 390, 590 260 S 720 110, 740 92" fill="none" stroke="#FDBE18" strokeOpacity=".6" strokeWidth="1.5" strokeDasharray="3 11" strokeLinecap="round" />
            <circle cx="740" cy="92" r="5" fill="#FDBE18" />
            <circle cx="740" cy="92" r="11" fill="none" stroke="#FDBE18" strokeOpacity=".5" />
          </svg>
          <div className="relative max-w-xl">
            <h2 className="font-display text-[2.1rem] font-semibold leading-[1.05] tracking-[-0.02em] md:text-[3.2rem]">{title}</h2>
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
