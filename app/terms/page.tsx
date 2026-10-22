import { LegalPage } from "@/components/LegalPage";
import { siteConfig, decisionDisclaimer } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Terms & Conditions", description: `Terms for using the ${siteConfig.name} website and services.`, path: "/terms" });

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions">
      <p>These terms apply to your use of this website and to services provided by {siteConfig.legalEntity}.</p>
      <h2>Our services</h2>
      <p>
        We provide guidance and application support for international education, documentation, visa preparation and relocation. The scope, fees and timelines of each service are confirmed in writing before work begins. [REPLACE: reference your client agreement.]
      </p>
      <h2>No guarantee of outcome</h2>
      <p>{decisionDisclaimer} We cannot guarantee admission, visas, scholarships or processing times.</p>
      <h2>Your responsibilities</h2>
      <ul>
        <li>Provide information and documents that are true, complete and your own.</li>
        <li>Tell us promptly about changes to your circumstances.</li>
        <li>Pay third-party fees (universities, embassies, translators, couriers) as they fall due.</li>
      </ul>
      <p>We will not submit, prepare or knowingly handle false or altered documents, and we may end our services if we find such documents.</p>
      <h2>Fees and refunds</h2>
      <p>[REPLACE: payment terms, what is refundable and when.]</p>
      <h2>Website content</h2>
      <p>
        Information on this website is general guidance and may not reflect the latest official requirements. Always confirm requirements with the relevant institution or authority.
      </p>
      <h2>Liability</h2>
      <p>[REPLACE: limitation of liability wording approved by your lawyer.]</p>
      <h2>Governing law</h2>
      <p>[REPLACE: the country whose law governs these terms.]</p>
      <h2>Contact</h2>
      <p><a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></p>
    </LegalPage>
  );
}
