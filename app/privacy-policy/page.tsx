import { LegalPage } from "@/components/LegalPage";
import { siteConfig } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Privacy Policy", description: `How ${siteConfig.name} collects, uses and protects your personal information.`, path: "/privacy-policy" });

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This policy explains how {siteConfig.legalEntity} (&quot;{siteConfig.shortName}&quot;, &quot;we&quot;) handles personal information when you use this website or our services.
      </p>
      <h2>Information we collect</h2>
      <ul>
        <li>Contact details you give us: name, email, WhatsApp or phone number, country.</li>
        <li>Details about your plans: destination, course, qualifications, intake, budget range and messages.</li>
        <li>Documents you choose to share with us during our services, through a secure channel we agree with you.</li>
        <li>Basic technical data such as browser type and pages visited, if analytics are enabled.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To respond to your enquiry and provide the services you request.</li>
        <li>To prepare applications and documents on your instructions.</li>
        <li>To keep records we are legally required to keep.</li>
      </ul>
      <p>We do not sell your personal information.</p>
      <h2>Sharing</h2>
      <p>
        With your agreement, we share information with universities, translators, notaries and other parties needed to deliver your service. Embassies and immigration authorities receive your documents only through your own application. [REPLACE: list any service providers such as email, form or storage providers.]
      </p>
      <h2>Storage and security</h2>
      <p>
        We store information securely and only for as long as needed for the purpose it was collected, or as required by law. [REPLACE: retention period and where data is stored.]
      </p>
      <h2>Your rights</h2>
      <p>
        Depending on where you live – for example under Nigeria&apos;s Data Protection Act 2023 – you may have the right to access, correct or delete your personal data, or to object to certain uses. Contact us at <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> to make a request.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about this policy: <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> or {siteConfig.phoneDisplay}.
      </p>
    </LegalPage>
  );
}
