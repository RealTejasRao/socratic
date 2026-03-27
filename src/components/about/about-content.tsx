"use client";

import { motion } from "framer-motion";

type AboutContentProps = {
  interClassName: string;
  paragraphs: string[];
};

export function AboutContent({ interClassName, paragraphs }: AboutContentProps) {
  return (
    <section className="px-6 pb-16 pt-14 sm:px-8 sm:pt-16">
      <article className={`mx-auto w-full max-w-240 ${interClassName}`}>
        <motion.h2
          className="text-[clamp(1.25rem,2.5vw,2.1rem)] font-medium leading-tight text-black"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          A honest story about why this exists.
        </motion.h2>

        <motion.div
          className="mt-10 border-t border-black/10 pt-8"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.52, delay: 0.05, ease: "easeOut" }}
        >
          {paragraphs.map((paragraph, index) => (
            <motion.p
              key={`${index}-${paragraph.slice(0, 18)}`}
              className="mb-6 text-[0.95rem] leading-8 text-black/78"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, delay: 0.03 * index, ease: "easeOut" }}
            >
              {paragraph}
            </motion.p>
          ))}
        </motion.div>
      </article>
    </section>
  );
}
