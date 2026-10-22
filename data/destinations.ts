/**
 * DESTINATIONS
 * ------------------------------------------------------------
 * To add a country: copy one object, change the slug and content,
 * add an image at /public/images/destinations/<slug>.svg|jpg.
 * The listing page, detail page, footer, forms and sitemap update
 * automatically.
 *
 * IMPORTANT: No visa fee or funds amounts are hard-coded. Rules and
 * amounts change – always link to the official source instead.
 * Review this file every few months against the official links.
 */
import { siteConfig } from "./site";

export type Destination = {
  slug: string;
  name: string;
  shortName: string;
  code: string; // 2–3 letter label shown on cards
  image: string;
  imageAlt: string;
  accent: string; // subtle colour used on the card tab
  intro: string;
  overview: string;
  studyOptions: string[];
  applicationProcess: string[];
  financialOverview: string;
  visaOverview: string;
  typicalDocuments: string[];
  whyStudents: string[];
  officialSources: { label: string; url: string }[];
  whatsappMessage: string;
};

export const destinations: Destination[] = [
  {
    slug: "germany",
    name: "Germany",
    shortName: "Germany",
    code: "DE",
    image: "/images/destinations/germany.svg",
    imageAlt: "University campus in Germany",
    accent: "#FDBE18",
    intro: "Low or no tuition at most public universities and a growing range of English-taught master's programmes.",
    overview:
      "Germany is one of the most popular destinations for African students, especially for engineering, computer science, business and the natural sciences. Most public universities charge little or no tuition, though semester contributions and living costs apply.",
    studyOptions: [
      "English-taught master's programmes",
      "Bachelor's degrees (often German-taught)",
      "Studienkolleg foundation year for some applicants",
      "Universities of applied sciences with practical focus",
    ],
    applicationProcess: [
      "Check whether your qualifications give direct entry or require a foundation year",
      "Apply directly to the university or through uni-assist, depending on the programme",
      "Receive an admission letter",
      "Arrange accepted proof of financial resources",
      "Apply for a national (D) student visa at the German mission",
    ],
    financialOverview:
      "Applicants must show they can cover living costs. Common options include a blocked account (Sperrkonto), a formal declaration of commitment from a sponsor living in Germany, or a recognised scholarship. The required amount is set by the German authorities and changes periodically.",
    visaOverview:
      "Non-EU students usually need a national student visa before travelling, followed by a residence permit after arrival. Appointment waiting times at German missions can be long, so plan early.",
    typicalDocuments: [
      "Valid passport",
      "University admission letter",
      "Accepted proof of financial resources",
      "Academic certificates and transcripts",
      "Health insurance evidence",
      "Language certificate if required by the programme",
    ],
    whyStudents: ["Low tuition at public universities", "Strong engineering and technical programmes", "Post-study job-search opportunities"],
    officialSources: [
      { label: "German Federal Foreign Office – visa information", url: "https://www.auswaertiges-amt.de/en/visa-service" },
      { label: "Study in Germany (DAAD)", url: "https://www.study-in-germany.de/en/" },
    ],
    whatsappMessage: `Hello ${siteConfig.shortName}, I am interested in studying in Germany and would like to understand the application process.`,
  },
  {
    slug: "canada",
    name: "Canada",
    shortName: "Canada",
    code: "CA",
    image: "/images/destinations/canada.svg",
    imageAlt: "Students on a Canadian university campus",
    accent: "#F7941D",
    intro: "Colleges and universities with practical, career-focused programmes and a large international student community.",
    overview:
      "Canada offers diplomas, degrees and postgraduate programmes at public colleges and universities. Study permit rules have changed several times in recent years, so current requirements must always be checked before applying.",
    studyOptions: ["College diplomas and certificates", "Bachelor's degrees", "Postgraduate certificates", "Master's programmes"],
    applicationProcess: [
      "Choose a programme at a designated learning institution (DLI)",
      "Apply and receive a letter of acceptance",
      "Obtain any additional letters currently required by Canadian authorities",
      "Prepare genuine proof of financial support",
      "Apply for a study permit online and complete biometrics",
    ],
    financialOverview:
      "Applicants must show they can pay tuition, living expenses and return travel. Canadian authorities set and periodically update the minimum living-cost amount, and they examine the history and source of funds.",
    visaOverview:
      "Most international students need a study permit. Applications are usually submitted online, followed by biometrics at a visa application centre.",
    typicalDocuments: [
      "Valid passport",
      "Letter of acceptance from a DLI",
      "Proof of financial support",
      "Academic records",
      "Statement of purpose",
      "Any additional letters required under current rules",
    ],
    whyStudents: ["Career-focused programmes", "Multicultural cities", "Clear official guidance from IRCC"],
    officialSources: [{ label: "Government of Canada – study permits", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada.html" }],
    whatsappMessage: `Hello ${siteConfig.shortName}, I am interested in studying in Canada and would like to understand the application process.`,
  },
  {
    slug: "united-kingdom",
    name: "United Kingdom",
    shortName: "UK",
    code: "UK",
    image: "/images/destinations/united-kingdom.svg",
    imageAlt: "Historic university building in the United Kingdom",
    accent: "#8FA2FF",
    intro: "Shorter degree programmes, including many one-year master's courses, at internationally recognised universities.",
    overview:
      "The UK is a long-standing choice for Nigerian and other African students. Many master's programmes last one year, and teaching is in English.",
    studyOptions: ["One-year taught master's", "Three-year bachelor's degrees", "Foundation and pathway programmes", "Research degrees"],
    applicationProcess: [
      "Apply to universities directly or through UCAS for undergraduate study",
      "Accept an offer and meet any conditions",
      "Pay any required deposit and receive a CAS from your university",
      "Prepare financial evidence that meets UK rules",
      "Apply for a Student visa online and attend a biometrics appointment",
    ],
    financialOverview:
      "Applicants usually need to show tuition fees plus living costs, and the money typically has to be held for a set period before applying. UK Visas and Immigration defines the amounts and accepted documents.",
    visaOverview:
      "Students need a Student visa, supported by a Confirmation of Acceptance for Studies (CAS) from a licensed university.",
    typicalDocuments: [
      "Valid passport",
      "CAS reference number",
      "Financial evidence meeting UK rules",
      "Academic qualifications listed on the CAS",
      "English language evidence if required",
      "TB test certificate where applicable",
    ],
    whyStudents: ["Shorter programmes", "English-language teaching", "Globally recognised qualifications"],
    officialSources: [{ label: "GOV.UK – Student visa", url: "https://www.gov.uk/student-visa" }],
    whatsappMessage: `Hello ${siteConfig.shortName}, I am interested in studying in the United Kingdom and would like to understand the application process.`,
  },
  {
    slug: "united-states",
    name: "United States",
    shortName: "USA",
    code: "US",
    image: "/images/destinations/united-states.svg",
    imageAlt: "Students walking on an American university campus",
    accent: "#FF8E8E",
    intro: "The widest choice of institutions and programmes, with flexible undergraduate study and funded graduate options.",
    overview:
      "The US has thousands of colleges and universities, from community colleges to major research universities. Some graduate programmes offer assistantships or scholarships.",
    studyOptions: ["Community college pathways", "Bachelor's degrees", "Master's degrees", "PhD programmes with funding options"],
    applicationProcess: [
      "Shortlist schools and check test and document requirements",
      "Apply and receive admission",
      "Receive a Form I-20 from a SEVP-certified school",
      "Pay the SEVIS fee",
      "Complete the visa application and attend an embassy interview",
    ],
    financialOverview:
      "Your school issues the I-20 only after reviewing evidence that you can cover at least the first year of costs. Consular officers may also ask about your funding and sponsors at interview.",
    visaOverview:
      "Most academic students apply for an F-1 visa. An interview at a US embassy or consulate is usually required.",
    typicalDocuments: [
      "Valid passport",
      "Form I-20",
      "SEVIS fee receipt",
      "Visa application confirmation",
      "Financial evidence",
      "Academic transcripts and test scores",
    ],
    whyStudents: ["Huge range of programmes", "Funding opportunities at graduate level", "Flexible academic structure"],
    officialSources: [{ label: "U.S. Department of State – student visa", url: "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html" }],
    whatsappMessage: `Hello ${siteConfig.shortName}, I am interested in studying in the United States and would like to understand the application process.`,
  },
  {
    slug: "russia",
    name: "Russia",
    shortName: "Russia",
    code: "RU",
    image: "/images/destinations/russia.svg",
    imageAlt: "University building in Russia",
    accent: "#7FD6C2",
    intro: "Affordable tuition, established medical and engineering faculties and a preparatory year for Russian language.",
    overview:
      "Russia attracts many African students, particularly for medicine, engineering and technical subjects. Many students begin with a preparatory faculty to learn Russian before starting their degree; some programmes are taught in English.",
    studyOptions: ["Preparatory faculty (Russian language)", "Medicine and health sciences", "Engineering and technical degrees", "Master's and postgraduate study"],
    applicationProcess: [
      "Choose a university and programme",
      "Submit academic documents (translated and notarised where required)",
      "Receive admission confirmation from the university",
      "The university requests the official study invitation from the Russian authorities",
      "Apply for a student visa at the Russian embassy or consulate with the original invitation",
    ],
    financialOverview:
      "Applicants should be able to cover tuition, accommodation and living costs. Payment terms are set by each university, and the embassy may ask for supporting documents.",
    visaOverview:
      "Students travel on a study visa issued on the basis of an official invitation arranged by the admitting university. Additional requirements, such as a medical certificate, may apply.",
    typicalDocuments: [
      "Valid passport",
      "Official study invitation",
      "Academic certificates with translation",
      "Medical certificates as required",
      "Visa application form and photographs",
    ],
    whyStudents: ["Affordable tuition", "Strong medical and engineering faculties", "Established African student communities"],
    officialSources: [{ label: "Study in Russia (official portal)", url: "https://studyinrussia.ru/en/" }],
    whatsappMessage: `Hello ${siteConfig.shortName}, I am interested in studying in Russia and would like to understand the application process.`,
  },
];

export const getDestination = (slug: string) => destinations.find((d) => d.slug === slug);
