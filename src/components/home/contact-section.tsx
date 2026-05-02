"use client";

import Image from "next/image";
import emailjs from "@emailjs/browser";
import { motion, useInView } from "framer-motion";
import { Instrument_Serif } from "next/font/google";
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

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
});

const CONTACT_HEADING_TEXT = "We'd love to hear from you :)";
const MAX_MESSAGE_WORDS = 2000;
const NAME_REGEX = /^[A-Za-z][A-Za-z\s'-]{0,79}$/;
const LOVE_START_INDEX = CONTACT_HEADING_TEXT.indexOf("love");
const LOVE_END_INDEX = LOVE_START_INDEX + "love".length - 1;
const SMILE_START_INDEX = CONTACT_HEADING_TEXT.lastIndexOf(":)");
const SMILE_END_INDEX = SMILE_START_INDEX + ":)".length - 1;
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
  const isAccentChar = (index: number) =>
    (index >= LOVE_START_INDEX && index <= LOVE_END_INDEX) ||
    (index >= SMILE_START_INDEX && index <= SMILE_END_INDEX);
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
      className="relative scroll-mt-1 overflow-hidden bg-[#fefefc] py-14 sm:py-16 lg:py-18"
    >
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(160,23,23,0.12)_1px,transparent_1.5px)] bg-[length:22px_22px]" />
      </div>

      <div className="relative mx-auto w-full">
        <div className="mx-auto max-w-355 px-6 sm:px-8">
          <motion.div
            key={`contact-heading-${restartSignal}`}
            className="mx-auto max-w-165 text-center"
            initial={{ opacity: 0, y: 34 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.95, ease: "easeOut" }}
          >
            <h2
              className={`${instrumentSerif.className} text-[clamp(1.8rem,5vw,3rem)] leading-tight text-black/90`}
            >
              <span ref={headingRef} className="inline-grid align-top">
                <span
                  className="col-start-1 row-start-1 invisible"
                  aria-hidden="true"
                >
                  {CONTACT_HEADING_TEXT}
                </span>
                <span className="col-start-1 row-start-1">
                  {typedHeading.split("").map((char, index) => (
                    <span
                      key={`${char}-${index}`}
                      className={isAccentChar(index) ? "text-[#A01717]" : ""}
                    >
                      {char}
                    </span>
                  ))}
                  <span className="hero-caret" aria-hidden="true" />
                </span>
              </span>
            </h2>
          </motion.div>
        </div>

        <div className="relative mt-8 min-h-[clamp(18rem,38vw,34rem)] w-full sm:mt-10">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
            <motion.div
              key={`contact-left-arm-${restartSignal}`}
              className="relative -translate-y-[20%] aspect-[1.9/1] w-[clamp(14rem,46vw,52rem)]"
              initial={{ x: -180, opacity: 0.45 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
            >
              <Image
                src="/contact/left_arm.png"
                alt="Left reaching hand artwork"
                fill
                className="object-contain object-left"
                sizes="(max-width: 640px) 46vw, (max-width: 1024px) 46vw, 42vw"
              />
            </motion.div>
          </div>

          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
            <motion.div
              key={`contact-right-arm-${restartSignal}`}
              className="relative -translate-y-[20%] aspect-[1.9/1] w-[clamp(14rem,46vw,52rem)]"
              initial={{ x: 180, opacity: 0.45 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
            >
              <Image
                src="/contact/right_arm.png"
                alt="Right reaching hand artwork"
                fill
                className="object-contain object-right"
                sizes="(max-width: 640px) 46vw, (max-width: 1024px) 46vw, 42vw"
              />
            </motion.div>
          </div>

          <div className="relative z-10 mx-auto flex w-full justify-center px-[clamp(4rem,18vw,24rem)] sm:px-[clamp(6rem,24vw,30rem)]">
            <motion.div
              key={`contact-form-${restartSignal}`}
              className={`${interClassName} relative w-full max-w-[22rem] rounded-[1.35rem] border border-black/8 bg-[#f5f5f3] p-3.5 sm:max-w-[23.5rem] sm:p-4`}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.95, ease: "easeOut", delay: 0.08 }}
            >
              <div className="relative -mx-3.5 -mt-3.5 overflow-hidden rounded-t-[1.35rem] px-3.5 py-3 sm:-mx-4 sm:-mt-4 sm:px-4">
                <div className="pointer-events-none absolute inset-0">
                  <Image
                    src="/contact/chp.png"
                    alt=""
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 640px) 100vw, 24rem"
                  />
                  <div className="absolute inset-0 bg-black/24" />
                </div>
                <h2
                  className={`${interClassName} relative z-10 text-center text-[clamp(0.92rem,1.2vw,1.08rem)] font-semibold tracking-[0.01em] text-white`}
                >
                  Contact Us
                </h2>
              </div>
              <form
                ref={formRef}
                onSubmit={handleSubmit}
                noValidate
                className="mx-auto mt-2.5 w-full max-w-[20rem] space-y-2.25 sm:max-w-[21rem]"
              >
                <div>
                  <label
                    htmlFor="contact-name"
                    className="mb-1 block text-[0.58rem] font-semibold tracking-[0.08em] text-black/63 uppercase"
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
                    className={`w-full rounded-full bg-white/90 px-3 py-2 text-[0.69rem] text-black shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] outline-none transition-all duration-200 placeholder:text-black/34 focus:ring-2 ${
                      nameStatus === "empty" || nameStatus === "invalid"
                        ? "border border-red-500/85 focus:border-red-500 focus:ring-red-500/20"
                        : nameStatus === "valid"
                          ? "border border-emerald-500/70 focus:border-emerald-500 focus:ring-emerald-500/18"
                          : "border border-black/30 focus:border-black/48 focus:ring-black/12"
                    }`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="mb-1 block text-[0.58rem] font-semibold tracking-[0.08em] text-black/63 uppercase"
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
                    className={`w-full rounded-full bg-white/90 px-3 py-2 text-[0.69rem] text-black shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] outline-none transition-all duration-200 placeholder:text-black/34 focus:ring-2 ${
                      emailStatus === "invalid"
                        ? "border border-red-500/85 focus:border-red-500 focus:ring-red-500/20"
                        : emailStatus === "valid"
                          ? "border border-emerald-500/70 focus:border-emerald-500 focus:ring-emerald-500/18"
                          : "border border-black/30 focus:border-black/48 focus:ring-black/12"
                    }`}
                  />
                  <p
                    className={`mt-1 min-h-[0.9rem] text-[0.56rem] ${
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
                    className="mb-1 block text-[0.58rem] font-semibold tracking-[0.08em] text-black/63 uppercase"
                  >
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={4}
                    placeholder="Drop your suggestion, feedback, or anything else..."
                    value={messageValue}
                    onChange={handleMessageChange}
                    onBlur={() => setMessageInteracted(true)}
                    className={`w-full resize-none rounded-2xl bg-white/90 px-3 py-2 text-[0.69rem] text-black shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] outline-none transition-all duration-200 placeholder:text-black/34 focus:ring-2 ${
                      messageStatus === "empty"
                        ? "border border-red-500/85 focus:border-red-500 focus:ring-red-500/20"
                        : "border border-black/30 focus:border-black/48 focus:ring-black/12"
                    }`}
                  />
                  <p className="mt-1.5 text-right text-[0.56rem] text-black/46">
                    {wordsLeft} words left
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full outline outline-[#A01717] bg-transparent px-4 py-2 text-[0.68rem] tracking-[0.04em] text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#a01717] hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span>{isSending ? "Sending..." : "Send Message"}</span>
                  <span aria-hidden="true">&gt;</span>
                </button>

                <p
                  className={`min-h-[1rem] text-[0.58rem] leading-4 ${
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
      </div>
    </section>
  );
}
