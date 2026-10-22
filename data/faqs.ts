export type FAQ = { q: string; a: string; category: "Getting started" | "Admissions" | "Documents & funds" | "Visas" | "Working with us" };

export const faqs: FAQ[] = [
  {
    category: "Getting started",
    q: "How do I start my study abroad application?",
    a: "Book a consultation or send us a WhatsApp message. We will ask about your qualifications, preferred country, course and budget, then explain realistic options and the documents you will need.",
  },
  {
    category: "Getting started",
    q: "Which countries do you support?",
    a: "We currently support applications to Germany, Canada, the United Kingdom, the United States and Russia. Ask us about other destinations – we will tell you honestly whether we can help.",
  },
  {
    category: "Admissions",
    q: "Can you help me choose a university?",
    a: "Yes. We compare programmes based on your academic background, budget, language of study and career goals, and explain the entry requirements of each option.",
  },
  {
    category: "Documents & funds",
    q: "What documents will I need?",
    a: "It depends on the country and programme. Most applications need a valid passport, academic certificates and transcripts, a CV or statement of purpose, and evidence of funding. Some also need language test results, translations or a police clearance certificate.",
  },
  {
    category: "Documents & funds",
    q: "What is proof of funds?",
    a: "Proof of funds is evidence that you, or your sponsor, genuinely have enough money to pay tuition and living costs. Each country sets its own rules about amounts, account types and how long funds must be held. We explain these rules and help you organise genuine documents.",
  },
  {
    category: "Documents & funds",
    q: "Can parents or relatives sponsor my studies?",
    a: "Often, yes. Many destinations accept sponsorship from parents or close relatives, but the sponsor usually needs to show the relationship, their own genuine funds and where the money comes from. Rules differ by country, so we check this during your consultation.",
  },
  {
    category: "Documents & funds",
    q: "Do you provide translation services?",
    a: "Yes. We arrange translation of academic, personal and immigration documents through qualified translators and coordinate notarization where needed. We will confirm which type of certified translation your institution or embassy accepts.",
  },
  {
    category: "Visas",
    q: "Can you guarantee my visa?",
    a: "No. Visa decisions are made exclusively by the relevant immigration authority or embassy. We help you prepare your application professionally and understand the required documentation.",
  },
  {
    category: "Admissions",
    q: "How long does the admission process take?",
    a: "It varies by country, university and intake. Some applications take a few weeks; others take several months. Starting six to twelve months before your intended intake gives you the most options.",
  },
  {
    category: "Working with us",
    q: "Can I book an online consultation?",
    a: "Yes. Consultations can take place by WhatsApp call or video call, so you can speak with us from anywhere.",
  },
  // --- Additional FAQs (FAQs page only) ---
  {
    category: "Admissions",
    q: "Can you guarantee admission to a university?",
    a: "No. Admission decisions are made by each university. We help you apply to programmes that match your profile and submit complete, well-prepared applications.",
  },
  {
    category: "Visas",
    q: "What happens if my visa is refused?",
    a: "We review the refusal letter with you, explain the reasons given, and discuss whether a new application or another option makes sense. Any fresh application must address the reasons for refusal honestly.",
  },
  {
    category: "Documents & funds",
    q: "Can you give me money to show in my bank account?",
    a: "No. We do not lend, deposit or arrange funds to be shown temporarily in an applicant's account. Embassies check the origin and history of funds, and presenting money that is not genuinely available to you can lead to refusal and bans.",
  },
  {
    category: "Working with us",
    q: "How much do your services cost?",
    a: "Fees depend on the service and destination. We explain our fees in writing before you commit to anything. University, embassy and translation fees are paid separately to the relevant institution. [REPLACE with the owner's pricing approach]",
  },
  {
    category: "Working with us",
    q: "Is my personal information safe?",
    a: "We only ask for the documents we need and handle them in line with our Privacy Policy. Please do not send passport or bank documents through public forms – we will share a secure way to send them.",
  },
];

/** Questions shown in the homepage preview (by index into `faqs`). */
export const homeFaqPreview = faqs.slice(0, 10);
