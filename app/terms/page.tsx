import { LegalPage } from "@/components/LegalPage";
import { siteConfig, decisionDisclaimer } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Terms & Conditions", description: `Terms for using the ${siteConfig.name} website and services.`, path: "/terms" });

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions">
      <h2>Our services</h2>
      <p>
        The services described on this website may include guidance on international education, university applications and admission, document preparation, flight booking and finding accommodation. The actual scope, fees and timelines for any engagement should be agreed in writing before paid work begins.
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
      <p>This website does not set service prices, payment deadlines or refund terms. Request and review a written quote and service agreement covering those details before making a payment. Third-party charges should be identified separately.</p>
      <h2>Website content</h2>
      <p>
        Information on this website is general guidance and may not reflect the latest official requirements. Always confirm requirements with the relevant institution or authority.
      </p>
      <h2>Liability</h2>
      <p>The website provides general information and is not a substitute for advice from the relevant institution, immigration authority or a qualified professional. Any liability wording must be completed and reviewed for the applicable jurisdiction before these terms are treated as final.</p>
      <h2>Governing law</h2>
      <p>The governing jurisdiction has not been supplied. This section must be completed with the business owner and reviewed by a qualified lawyer before production use.</p>
      <h2>Contact</h2>
      <p><a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></p>
    </LegalPage>
  );
}
