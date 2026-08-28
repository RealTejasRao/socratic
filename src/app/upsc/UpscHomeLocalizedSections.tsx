"use client";

import {
  FeaturesSection,
  upscFeatureCards,
} from "@/src/components/home/features-section";
import { ContactSection } from "@/src/components/home/contact-section";
import { SecuritySeparator } from "@/src/components/home/security-separator";
import {
  UseCasesSection,
  upscUseCaseItems,
} from "@/src/components/home/use-cases-section";
import {
  getUpscHomeCopy,
  type UpscHomeLocale,
} from "@/src/lib/upsc-home-locale";

type UpscHomeLocalizedSectionsProps = {
  interClassName: string;
  locale: UpscHomeLocale;
};

export function UpscHomeLocalizedSections({
  interClassName,
  locale,
}: UpscHomeLocalizedSectionsProps) {
  const copy = getUpscHomeCopy(locale);
  const localizedFeatureCards = upscFeatureCards.map((card, index) => ({
    ...card,
    title: copy.features.cards[index]?.title ?? card.title,
    description: copy.features.cards[index]?.description ?? card.description,
  }));
  const localizedUseCaseItems = upscUseCaseItems.map((item, index) => ({
    ...item,
    leftTitle: copy.useCases.items[index]?.leftTitle ?? item.leftTitle,
    leftDescription:
      copy.useCases.items[index]?.leftDescription ?? item.leftDescription,
    rightTitle: copy.useCases.items[index]?.rightTitle ?? item.rightTitle,
    rightDescription:
      copy.useCases.items[index]?.rightDescription ?? item.rightDescription,
  }));

  return (
    <>
      <FeaturesSection
        interClassName={interClassName}
        headingSubject="UPSC Aspirants"
        headingText={copy.features.heading}
        highlightedTerms={copy.features.highlightedTerms}
        cards={localizedFeatureCards}
      />
      <SecuritySeparator
        interClassName={interClassName}
        message={copy.security.message}
        highlightedTerm={copy.security.highlightedTerm}
      />
      <UseCasesSection
        interClassName={interClassName}
        items={localizedUseCaseItems}
        headingText={copy.useCases.heading}
        mobileFirstLineText={copy.useCases.mobileFirstLine}
        mobileSecondLineText={copy.useCases.mobileSecondLine}
        highlightedWord={copy.useCases.highlightedWord}
      />
      <ContactSection interClassName={interClassName} copy={copy.contact} />
    </>
  );
}
