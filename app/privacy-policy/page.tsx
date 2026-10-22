import { LegalPage } from "@/components/LegalPage";
import { siteConfig } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Privacy Policy", description: `How ${siteConfig.name} collects, uses and protects your personal information.`, path: "/privacy-policy" });

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This draft explains the information this website may collect when you contact {siteConfig.name} (&quot;{siteConfig.shortName}&quot;, &quot;we&quot;). The registered service provider, applicable jurisdiction and final data-handling arrangements must be confirmed before this policy is approved.
      </p>
      <h2>Information we collect</h2>
      <ul>
        <li>Contact details you give us: name, email, WhatsApp or phone number, country.</li>
        <li>Details about your plans: destination, course, qualifications, intake, budget range and messages.</li>
        <li>Information you include in an enquiry message. Do not submit passport, bank-account or other sensitive documents through this website.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To respond to your enquiry and provide the services you request.</li>
        <li>To prepare applications and documents on your instructions.</li>
        <li>To keep records we are legally required to keep.</li>
      </ul>
      <p>The business must confirm its actual data practices and any third-party disclosures before this draft is approved.</p>
      <h2>Sharing</h2>
      <p>
        Website enquiries are sent to the business only when a form-delivery provider has been configured. No form-delivery provider is currently configured for this review deployment, so online enquiries cannot be delivered. Before launch, identify the provider and explain its role here. Information should not be shared with institutions or other service providers without an appropriate service request and your instructions.
      </p>
      <h2>Storage and security</h2>
      <p>
        This website does not provide document upload or document storage. The business must confirm its enquiry retention period, storage locations, access controls and deletion process before accepting personal information through a live form.
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
