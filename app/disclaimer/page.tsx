import { LegalPage } from "@/components/LegalPage";
import { siteConfig, decisionDisclaimer, fundsIntegrityNotice, requirementsChangeNotice } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Disclaimer", description: `Important information about the limits of ${siteConfig.name}'s services.`, path: "/disclaimer" });

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer">
      <h2 className="!mt-0">Decisions are made by institutions and authorities</h2>
      <p>{decisionDisclaimer}</p>
      <h2>No guarantees</h2>
      <p>We do not guarantee visas, university admissions, scholarships or processing times, and nobody can legitimately do so.</p>
      <h2>Financial documentation</h2>
      <p>
        {fundsIntegrityNotice} Our proof of funds guidance explains requirements and helps you organise genuine documents. We do not lend, deposit or arrange money to be shown in an applicant&apos;s account, and we do not produce bank statements or sponsorship letters on behalf of people who are not genuine sponsors.
      </p>
      <h2>Translations and certification</h2>
      <p>
        Translation, certification and notarization requirements vary by institution and destination. Confirm the provider, credentials, price and accepted format in writing before authorising any work.
      </p>
      <h2>Changing requirements</h2>
      <p>{requirementsChangeNotice}</p>
      <h2>Independence</h2>
      <p>
        {siteConfig.name} is not an embassy, government agency or university. Any business registration details or institutional affiliations should be verified directly and confirmed in a written agreement.
      </p>
    </LegalPage>
  );
}
