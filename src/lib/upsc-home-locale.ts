export type UpscHomeLocale = "en" | "hi";

export type UpscHomeCopy = {
  locale: UpscHomeLocale;
  nav: {
    home: string;
    features: string;
    pricing: string;
    blog: string;
    contact: string;
    openApp: string;
    languageLabel: string;
  };
  hero: {
    srOnly: string;
    headlinePrefix: string;
    headlineSuffix?: string;
    words: readonly string[];
    subheading: string;
    cta: string;
  };
  features: {
    heading: string;
    highlightedTerms: readonly string[];
    cards: readonly {
      title: string;
      description: string;
    }[];
  };
  security: {
    message: string;
    highlightedTerm: string;
  };
  useCases: {
    heading: string;
    mobileFirstLine: string;
    mobileSecondLine: string;
    highlightedWord: string;
    items: readonly {
      leftTitle: string;
      leftDescription: string;
      rightTitle: string;
      rightDescription: string;
    }[];
  };
  contact: {
    heading: string;
    mobileFirstLine: string;
    mobileSecondLine: string;
    highlightedTerms: readonly string[];
    title: string;
    name: string;
    namePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    message: string;
    messagePlaceholder: string;
    wordsLeft: (count: number) => string;
    send: string;
    sending: string;
  };
  footer: {
    descriptionLines: readonly string[];
    cta: string;
    explore: string;
    account: string;
    preferences: string;
    home: string;
    features: string;
    blog: string;
    contact: string;
    pricing: string;
    goToApp: string;
    getSocraticPlus: string;
    privacyPolicy: string;
    terms: string;
    cookiePolicy: string;
    consentPreferences: string;
  };
};

const en: UpscHomeCopy = {
  locale: "en",
  nav: {
    home: "Home",
    features: "Features",
    pricing: "Pricing",
    blog: "Blog",
    contact: "Contact",
    openApp: "Open App",
    languageLabel: "हिंदी",
  },
  hero: {
    srOnly:
      "Crack UPSC by Learning to Think Like a Civil Servant, Policy Maker, Problem Solver, and Leader.",
    headlinePrefix: "Crack UPSC by Learning to Think Like a",
    headlineSuffix: "",
    words: ["Civil Servant", "Policy Maker", "Problem Solver", "Leader"],
    subheading:
      "Think sharper. Answer better. Walk into UPSC, ready for anything.",
    cta: "Start for Free",
  },
  features: {
    heading: "Built Different.\nBuilt For UPSC Aspirants",
    highlightedTerms: ["Different", "UPSC Aspirants"],
    cards: [
      {
        title: "Think Beyond\nYour Notes",
        description:
          "Turn what you learn into better thoughts, arguments and answers.",
      },
      {
        title: "Master Ethics\n& Essay",
        description:
          "Answer Ethics questions and Essay topics with full confidence in Mains.",
      },
      {
        title: "Build The\nUPSC Mindset",
        description:
          "Learn to see every issue from different sides and think with balance.",
      },
      {
        title: "Prepare for\nthe Interview",
        description:
          "Practise tough questions and learn to answer them clearly and confidently.",
      },
    ],
  },
  security: {
    message: "Your conversations stay private. Always.",
    highlightedTerm: "private",
  },
  useCases: {
    heading: "One AI. Three Powerful Modes",
    mobileFirstLine: "One AI.",
    mobileSecondLine: "Three Powerful Modes",
    highlightedWord: "Powerful",
    items: [
      {
        leftTitle: "Socratic Mode",
        leftDescription:
          "Specially designed to make you think and reason better",
        rightTitle: "Master Every Topic From Every Angle.",
        rightDescription:
          "Build stronger, balanced answers for GS, Ethics and Essay by mastering every side of a question.",
      },
      {
        leftTitle: "Debate Mode",
        leftDescription:
          "Debate UPSC topics and learn to think fast under pressure.",
        rightTitle: "Make your Answer Hard to Break",
        rightDescription:
          "Become a master of arguments, counter arguments and rebuttals for Essay, GS and the Personality Test.",
      },
      {
        leftTitle: "Roleplay Mode",
        leftDescription:
          "Talk directly with history's greatest thinkers and understand their ideas by directly talking to them.",
        rightTitle: "Learn Ethics From The Greatest Minds.",
        rightDescription:
          "Discuss justice, duty, morality and society with Socrates, Buddha, Chanakya and many other thinkers.",
      },
    ],
  },
  contact: {
    heading: "We'd love to hear from you :)",
    mobileFirstLine: "We'd love to",
    mobileSecondLine: "hear from you :)",
    highlightedTerms: ["love", ":)"],
    title: "Contact Us",
    name: "Name",
    namePlaceholder: "Your name",
    email: "Email",
    emailPlaceholder: "you@example.com",
    message: "Message",
    messagePlaceholder: "Drop your suggestion, feedback, or anything else...",
    wordsLeft: (count) => `${count} words left`,
    send: "Send Message",
    sending: "Sending...",
  },
  footer: {
    descriptionLines: [
      "Built to help you think like a Civil Servant.",
      "Think deeper. Answer better. Crack UPSC.",
    ],
    cta: "START YOUR UPSC PRACTICE",
    explore: "Explore",
    account: "Account",
    preferences: "Preferences",
    home: "Home",
    features: "Features",
    blog: "Blog",
    contact: "Contact",
    pricing: "Pricing",
    goToApp: "Go to App",
    getSocraticPlus: "Get Socratic +",
    privacyPolicy: "Privacy Policy",
    terms: "Terms & Conditions",
    cookiePolicy: "Cookie Policy",
    consentPreferences: "Consent Preferences",
  },
};

const hi: UpscHomeCopy = {
  ...en,
  locale: "hi",
  nav: {
    home: "होम",
    features: "विशेषताएँ",
    pricing: "कीमत",
    blog: "ब्लॉग",
    contact: "संपर्क करें",
    openApp: "ऐप खोलें",
    languageLabel: "English",
  },
  hero: {
    srOnly:
      "UPSC में सफलता पाएँ। सिविल सर्वेंट, नीति-निर्माता, समस्या-समाधानकर्ता और लीडर की तरह सोचें।",
    headlinePrefix: "UPSC में सफलता पाएँ। सोचें, समझें और बनें एक",
    headlineSuffix: "",
    words: ["सिविल सर्वेंट", "नीति-निर्माता", "लीडर"],
    subheading:
      "तेज़ी से सोचें। बेहतर उत्तर दें। UPSC की हर चुनौती के लिए तैयार रहें।",
    cta: "फ्री में शुरू करें",
  },
  features: {
    heading: "अलग सोच वाले UPSC\nAspirants के लिए बनाया गया।",
    highlightedTerms: ["अलग", "UPSC"],
    cards: [
      {
        title: "नोट्स से आगे\nसोचें",
        description: "जो पढ़ें, उसे बेहतर सोच, तर्क और उत्तर में बदलें।",
      },
      {
        title: "Ethics और Essay\nमें मास्टर बनें",
        description:
          "Mains में Ethics और Essay के सवाल पूरे आत्मविश्वास से हल करें।",
      },
      {
        title: "UPSC Mindset\nबनाएं",
        description:
          "हर विषय को अलग-अलग नज़रिए से देखें और संतुलित सोच बनाएं।",
      },
      {
        title: "Interview के लिए\nतैयार हों",
        description:
          "कठिन सवालों का जवाब साफ़ और आत्मविश्वास से देना सीखें।",
      },
    ],
  },
  security: {
    message: "हम पर भरोसा रखें। आपकी चैट हमेशा प्राइवेट रहती है।",
    highlightedTerm: "प्राइवेट",
  },
  useCases: {
    heading: "एक AI. तीन दमदार Modes.",
    mobileFirstLine: "एक AI.",
    mobileSecondLine: "तीन दमदार Modes.",
    highlightedWord: "दमदार",
    items: [
      {
        leftTitle: "Socratic Mode",
        leftDescription: "आपकी सोच और तर्कशक्ति को बेहतर बनाने के लिए।",
        rightTitle: "हर विषय को हर एक नज़रिए से समझें।",
        rightDescription:
          "GS, Ethics और Essay में गहरे, संतुलित और बेहतर उत्तर बनाएं।",
      },
      {
        leftTitle: "Debate Mode",
        leftDescription:
          "UPSC के विषयों पर Debate करें और दबाव में तेज़ी से सोचना सीखें।",
        rightTitle: "ऐसे उत्तर बनाएं जिन्हें चुनौती देना मुश्किल हो।",
        rightDescription:
          "Essay, GS और Personality Test के लिए तर्क, प्रतितर्क और प्रभावी जवाब देने की कला में महारत हासिल करें।",
      },
      {
        leftTitle: "Roleplay Mode",
        leftDescription:
          "इतिहास के महान विचारकों से सीधे बात करें और उनकी सोच को बेहतर समझें।",
        rightTitle: "Ethics सीखें दुनिया के महान विचारकों से।",
        rightDescription:
          "Socrates, Buddha, Chanakya और कई अन्य विचारकों के साथ न्याय, कर्तव्य, नैतिकता और समाज पर चर्चा करें।",
      },
    ],
  },
  contact: {
    heading: "अपनी बात हम तक पहुँचाएँ :)",
    mobileFirstLine: "अपनी बात",
    mobileSecondLine: "हम तक पहुँचाएँ :)",
    highlightedTerms: ["पहुँचाएँ", ":)"],
    title: "संपर्क करें",
    name: "नाम",
    namePlaceholder: "आपका नाम",
    email: "ईमेल",
    emailPlaceholder: "you@example.com",
    message: "संदेश",
    messagePlaceholder: "अपना सुझाव या कोई भी बात यहाँ लिखें...",
    wordsLeft: (count) => `${count} शब्द बाकी`,
    send: "संदेश भेजें",
    sending: "भेज रहे हैं...",
  },
  footer: {
    descriptionLines: [
      "सिविल सर्वेंट की तरह सोचने में आपकी मदद के लिए बनाया गया।",
      "गहराई से सोचें। बेहतर उत्तर दें। UPSC क्रैक करें।",
    ],
    cta: "फ्री में शुरू करें",
    explore: "जानें",
    account: "अकाउंट",
    preferences: "सेटिंग्स",
    home: "होम",
    features: "विशेषताएँ",
    blog: "ब्लॉग",
    contact: "संपर्क करें",
    pricing: "कीमत",
    goToApp: "ऐप खोलें",
    getSocraticPlus: "Socratic + पाएं",
    privacyPolicy: "प्राइवेसी पॉलिसी",
    terms: "नियम और शर्तें",
    cookiePolicy: "कुकी पॉलिसी",
    consentPreferences: "सहमति सेटिंग्स",
  },
};

export const UPSC_HOME_LOCALE_COOKIE = "socratic:upsc-home-locale";

export function resolveUpscHomeLocale(value: string | string[] | undefined) {
  const firstValue = Array.isArray(value) ? value[0] : value;
  return firstValue?.toLowerCase().trim() === "hi" ? "hi" : "en";
}

export function getUpscHomeCopy(locale: UpscHomeLocale): UpscHomeCopy {
  return locale === "hi" ? hi : en;
}
