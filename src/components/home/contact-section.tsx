"use client";

import Image from "next/image";
import emailjs from "@emailjs/browser";
import { motion, useInView } from "framer-motion";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type ContactSectionProps = {
  interClassName: string;
};

const CONTACT_HEADING_TEXT = "Contact Us";
const MAX_MESSAGE_WORDS = 2000;
const NAME_REGEX = /^[A-Za-z][A-Za-z\s'-]{0,79}$/;
const EMAILJS_SERVICE_ID = process.env["NEXT_PUBLIC_EMAILJS_SERVICE_ID"] ?? "";
const EMAILJS_TEMPLATE_ID =
  process.env["NEXT_PUBLIC_EMAILJS_TEMPLATE_ID"] ?? "";
const EMAILJS_PUBLIC_KEY = process.env["NEXT_PUBLIC_EMAILJS_PUBLIC_KEY"] ?? "";

const sanitizeField = (value: string) =>
  value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const countWords = (value: string) => {
  const normalized = value.trim();
  if (!normalized) return 0;
  return normalized.split(/\s+/).length;
};

const isValidEmail = (value: string) => {
  const email = value.trim().toLowerCase();
  if (!email) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return false;

  const [localPart, domainPart] = email.split("@");
  if (!localPart || !domainPart) return false;
  if (localPart.startsWith(".") || localPart.endsWith(".")) return false;
  if (domainPart.startsWith(".") || domainPart.endsWith(".")) return false;
  if (email.includes("..")) return false;

  return true;
};

export function ContactSection({ interClassName }: ContactSectionProps) {
  const headingRef = useRef<HTMLSpanElement | null>(null);
  const headingInView = useInView(headingRef, { once: true, amount: 0.8 });
  const formRef = useRef<HTMLFormElement | null>(null);
  const [visibleHeadingChars, setVisibleHeadingChars] = useState(0);
  const [restartSignal, setRestartSignal] = useState(0);
  const [nameValue, setNameValue] = useState("");
  const [nameInteracted, setNameInteracted] = useState(false);
  const [messageValue, setMessageValue] = useState("");
  const [messageInteracted, setMessageInteracted] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [emailInteracted, setEmailInteracted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [submitState, setSubmitState] = useState<{
    type: "idle" | "success" | "error";
    message: string;
  }>({
    type: "idle",
    message: "",
  });
  const typedHeading = CONTACT_HEADING_TEXT.slice(0, visibleHeadingChars);
  const wordsUsed = countWords(messageValue);
  const wordsLeft = Math.max(0, MAX_MESSAGE_WORDS - wordsUsed);
  const sanitizedName = sanitizeField(nameValue);
  const sanitizedMessage = sanitizeField(messageValue);
  const nameStatus = !nameInteracted
    ? "idle"
    : !sanitizedName
      ? "empty"
      : NAME_REGEX.test(sanitizedName)
        ? "valid"
        : "invalid";
  const messageStatus = !messageInteracted
    ? "idle"
    : sanitizedMessage.length === 0
      ? "empty"
      : "valid";
  const emailStatus = !emailInteracted
    ? "idle"
    : emailValue.trim().length === 0
      ? "empty"
      : isValidEmail(emailValue)
        ? "valid"
        : "invalid";

  useEffect(() => {
    const onRestart = (event: Event) => {
      const customEvent = event as CustomEvent<{ sectionId?: string }>;
      if (customEvent.detail?.sectionId !== "contact") return;
      setVisibleHeadingChars(0);
      setRestartSignal((count) => count + 1);
    };

    window.addEventListener("section:typewriter:restart", onRestart);
    return () =>
      window.removeEventListener("section:typewriter:restart", onRestart);
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash !== "#contact") return;
      setVisibleHeadingChars(0);
      setRestartSignal((count) => count + 1);
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!headingInView && restartSignal === 0) return;

    const interval = window.setInterval(() => {
      setVisibleHeadingChars((count) => {
        if (count >= CONTACT_HEADING_TEXT.length) {
          window.clearInterval(interval);
          return count;
        }
        return count + 1;
      });
    }, 52);

    return () => window.clearInterval(interval);
  }, [headingInView, restartSignal]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSending) return;

    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      setSubmitState({
        type: "error",
        message:
          "Email service is not configured yet. Add EmailJS env variables.",
      });
      return;
    }

    setNameInteracted(true);
    setEmailInteracted(true);
    setMessageInteracted(true);

    const name = sanitizedName;
    const email = sanitizeField(emailValue).toLowerCase();
    const message = sanitizedMessage;

    if (!name || !email || !message) {
      setSubmitState({
        type: "error",
        message: "Please complete all required fields.",
      });
      return;
    }

    if (!NAME_REGEX.test(name)) {
      setSubmitState({
        type: "error",
        message: "Please fix highlighted fields before sending.",
      });
      return;
    }

    if (!isValidEmail(email)) {
      setSubmitState({
        type: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    if (countWords(message) > MAX_MESSAGE_WORDS) {
      setSubmitState({
        type: "error",
        message: "Message is too long. Maximum allowed is 2000 words.",
      });
      return;
    }

    try {
      setIsSending(true);
      setSubmitState({ type: "idle", message: "" });

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          name,
          email,
          message,
        },
        { publicKey: EMAILJS_PUBLIC_KEY },
      );

      setSubmitState({
        type: "success",
        message: "Message sent successfully. Thanks for sharing!",
      });
      formRef.current?.reset();
      setNameValue("");
      setNameInteracted(false);
      setMessageValue("");
      setMessageInteracted(false);
      setEmailValue("");
      setEmailInteracted(false);
    } catch {
      setSubmitState({
        type: "error",
        message: "Could not send right now. Please try again in a moment.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleMessageChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (!messageInteracted) setMessageInteracted(true);

    const nextValue = event.target.value;
    const wordCount = countWords(nextValue);

    if (wordCount <= MAX_MESSAGE_WORDS) {
      setMessageValue(nextValue);
      return;
    }

    const trimmedWords = nextValue
      .trim()
      .split(/\s+/)
      .slice(0, MAX_MESSAGE_WORDS);
    setMessageValue(trimmedWords.join(" "));
  };

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmailValue(event.target.value);
    if (!emailInteracted) setEmailInteracted(true);
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNameValue(event.target.value);
    if (!nameInteracted) setNameInteracted(true);
  };

  return (
    <section
      id="contact"
      className="relative scroll-mt-1 bg-white px-6 py-14 sm:px-8 sm:py-16 lg:py-18"
    >
      <div className="mx-auto w-full max-w-330">
        <div className="text-center">
          <h2
            className={`${interClassName} text-[clamp(1.2rem,2.6vw,2.2rem)] font-medium leading-tight text-black`}
          >
            <span ref={headingRef} className="inline-grid align-top">
              <span
                className="col-start-1 row-start-1 invisible"
                aria-hidden="true"
              >
                {CONTACT_HEADING_TEXT}
              </span>
              <span className="col-start-1 row-start-1">
                {typedHeading}
                <span className="hero-caret" aria-hidden="true" />
              </span>
            </span>
          </h2>
          <p className="mx-auto mt-8 inline-flex max-w-152 items-center gap-2 text-[clamp(0.74rem,0.95vw,0.9rem)] leading-[1.6] text-black/62">
            <span
              className="relative inline-flex h-2.5 w-2.5 items-center justify-center"
              aria-hidden="true"
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500/55" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
            </span>
            <span>Suggestions, feedback, or anything on your mind.</span>
          </p>
        </div>

        <div className="mx-auto mt-12 grid w-full max-w-4xl gap-4 lg:mt-14 lg:grid-cols-[0.86fr_1fr] lg:gap-8">
          <div className="relative overflow-hidden rounded-xl border border-black/12 bg-[#f2f2f2]">
            <div className="relative h-42 w-full sm:h-48 lg:h-full lg:min-h-62">
              <Image
                src="/media/About/final_flower.png"
                alt="Floral artwork"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 42vw"
              />
            </div>
          </div>

          <motion.div
            className="flex flex-col justify-center"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <h2
              className={`${interClassName} text-[clamp(0.94rem,1.6vw,1.32rem)] font-medium leading-tight text-black`}
            >
              We&apos;d love to hear from you :)
            </h2>
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              noValidate
              className="mt-3 max-w-108 space-y-2.5"
            >
              <div>
                <label
                  htmlFor="contact-name"
                  className="mb-1 block text-[0.66rem] font-medium text-black/82"
                >
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  maxLength={80}
                  value={nameValue}
                  onChange={handleNameChange}
                  onBlur={() => setNameInteracted(true)}
                  autoComplete="name"
                  placeholder="Your name"
                  className={`w-full rounded-md bg-white px-2.5 py-1.75 text-[0.7rem] text-black shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] outline-none transition-all duration-200 placeholder:text-black/35 focus:ring-1 ${
                    nameStatus === "empty" || nameStatus === "invalid"
                      ? "border border-red-500/85 focus:border-red-500 focus:ring-red-500/20"
                      : nameStatus === "valid"
                        ? "border border-emerald-500/70 focus:border-emerald-500 focus:ring-emerald-500/20"
                        : "border border-black/40 focus:border-black/55 focus:ring-black/22"
                  }`}
                />
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="mb-1 block text-[0.66rem] font-medium text-black/82"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  maxLength={254}
                  value={emailValue}
                  onChange={handleEmailChange}
                  onBlur={() => setEmailInteracted(true)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`w-full rounded-md bg-white px-2.5 py-1.75 text-[0.7rem] text-black shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] outline-none transition-all duration-200 placeholder:text-black/35 focus:ring-1 ${
                    emailStatus === "invalid"
                      ? "border border-red-500/85 focus:border-red-500 focus:ring-red-500/20"
                      : emailStatus === "valid"
                        ? "border border-emerald-500/70 focus:border-emerald-500 focus:ring-emerald-500/20"
                        : "border border-black/40 focus:border-black/55 focus:ring-black/22"
                  }`}
                />
                <p
                  className={`mt-1 min-h-[0.9rem] text-[0.58rem] ${
                    emailStatus === "invalid"
                      ? "text-red-600"
                      : emailStatus === "valid"
                        ? "text-emerald-700"
                        : "text-transparent"
                  }`}
                  aria-live="polite"
                >
                  {emailStatus === "invalid"
                    ? "Enter a valid email (example@domain.com)."
                    : emailStatus === "valid"
                      ? "Email looks good."
                      : "."}
                </p>
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="mb-1 block text-[0.66rem] font-medium text-black/82"
                >
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={2}
                  placeholder="Drop your suggestion, feedback, or anything else..."
                  value={messageValue}
                  onChange={handleMessageChange}
                  onBlur={() => setMessageInteracted(true)}
                  className={`w-full resize-none rounded-md bg-white px-2.5 py-1.75 text-[0.7rem] text-black shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] outline-none transition-all duration-200 placeholder:text-black/35 focus:ring-1 ${
                    messageStatus === "empty"
                      ? "border border-red-500/85 focus:border-red-500 focus:ring-red-500/20"
                      : "border border-black/40 focus:border-black/55 focus:ring-black/22"
                  }`}
                />
                <p className="mt-1.5 text-right text-[0.6rem] text-black/48">
                  {wordsLeft} words left
                </p>
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-black/12 bg-black px-4 py-1.75 text-[0.7rem] font-medium text-white transition-colors duration-200 hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span>{isSending ? "Sending..." : "Send Message"}</span>
                <span aria-hidden="true">&gt;</span>
              </button>

              <p
                className={`min-h-[1.1rem] text-[0.63rem] leading-4 ${
                  submitState.type === "success"
                    ? "text-emerald-700"
                    : submitState.type === "error"
                      ? "text-red-600"
                      : "text-transparent"
                }`}
                role="status"
                aria-live="polite"
              >
                {submitState.message || "."}
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
