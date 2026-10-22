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
        Translations are carried out by qualified translators and notarization by licensed notaries. Acceptance of a translation is decided by the receiving institution; we confirm the required format with you before starting.
      </p>
      <h2>Changing requirements</h2>
      <p>{requirementsChangeNotice}</p>
      <h2>Independence</h2>
      <p>
        {siteConfig.name} is an independent consultancy. We are not an embassy, government agency or university, and we are not affiliated with any unless stated in writing. [UPDATE if you hold verified partnerships.]
      </p>
    </LegalPage>
  );
}
