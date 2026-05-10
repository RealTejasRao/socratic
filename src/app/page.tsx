import type { Metadata } from "next";
import EarlyAccessPage from "@/src/components/home/early-access-page";
import { createFaqSchema, createPageMetadata } from "@/src/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Socratic AI | AI Thinking Partner for Philosophy and Strategy",
  description:
    "Join Socratic AI early access. Train sharper reasoning with an AI for philosophy, strategy AI workflows, and an intelligent learning assistant.",
  path: "/",
  keywords: [
    "Socratic AI",
    "AI for philosophy",
    "ai thinking partner",
    "strategy AI",
    "philosophy AI",
    "intelligent learning assistant",
    "Socratic dialogue",
  ],
});

const homepageFaqSchema = createFaqSchema([
  {
    question: "What is Socratic AI?",
    answer:
      "Socratic AI is an AI thinking partner designed for philosophy, strategic reasoning, and reflective learning through question-driven dialogue.",
  },
  {
    question: "Who is Socratic AI for?",
    answer:
      "Socratic AI is built for students, thinkers, creators, and decision-makers who want a structured intelligent learning assistant for clearer thinking.",
  },
  {
    question: "How is Socratic AI different from generic chatbots?",
    answer:
      "Socratic AI focuses on reasoning quality, argument clarity, and disciplined inquiry instead of fast one-shot answers.",
  },
]);

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageFaqSchema) }}
      />
      <EarlyAccessPage />
    </>
  );
}
