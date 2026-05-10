"use client";

import Image from "next/image";
import emailjs from "@emailjs/browser";
import { motion, type Variants, useInView } from "framer-motion";
import { Instrument_Serif } from "next/font/google";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { resolveOptimizedCloudinaryPublicAsset } from "@/src/lib/cloudinary-public-assets";

type ContactSectionProps = {
  interClassName: string;
};

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
});

const CONTACT_HEADING_TEXT = "We'd love to hear from you :)";
const MOBILE_CONTACT_FIRST_LINE_TEXT = "We'd love to";
const MOBILE_CONTACT_SECOND_LINE_TEXT = "hear from you :)";
const MAX_MESSAGE_WORDS = 2000;
const NAME_REGEX = /^[A-Za-z][A-Za-z\s'-]{0,79}$/;
const LOVE_START_INDEX = CONTACT_HEADING_TEXT.indexOf("love");
const LOVE_END_INDEX = LOVE_START_INDEX + "love".length - 1;
const SMILE_START_INDEX = CONTACT_HEADING_TEXT.lastIndexOf(":)");
const SMILE_END_INDEX = SMILE_START_INDEX + ":)".length - 1;
const mobileContactFirstLineLength = MOBILE_CONTACT_FIRST_LINE_TEXT.length;
const mobileContactSecondLineStart = Math.max(
  0,
  CONTACT_HEADING_TEXT.indexOf(MOBILE_CONTACT_SECOND_LINE_TEXT),
);
const EMAILJS_SERVICE_ID = process.env["NEXT_PUBLIC_EMAILJS_SERVICE_ID"] ?? "";
const EMAILJS_TEMPLATE_ID =
  process.env["NEXT_PUBLIC_EMAILJS_TEMPLATE_ID"] ?? "";
const EMAILJS_PUBLIC_KEY = process.env["NEXT_PUBLIC_EMAILJS_PUBLIC_KEY"] ?? "";
const CONTACT_EASE = [0.22, 1, 0.36, 1] as const;

const leftArmVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -240,
    y: 110,
    rotate: -9,
    scale: 0.9,
  },
  show: {
    opacity: 1,
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    transition: { duration: 1.4, ease: CONTACT_EASE, delay: 0.05 },
  },
};

const rightArmVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 240,
    y: 110,
    rotate: 9,
    scale: 0.9,
  },
  show: {
    opacity: 1,
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    transition: { duration: 1.4, ease: CONTACT_EASE, delay: 0.09 },
  },
};
const mobileHeadingLeftArmInitial = {
  opacity: 0,
  x: -120,
  y: 42,
  rotate: -9,
  scale: 0.9,
};
const mobileHeadingRightArmInitial = {
  opacity: 0,
  x: 120,
  y: 42,
  rotate: 9,
  scale: 0.9,
};
const mobileHeadingArmInView = {
  opacity: 1,
  x: 0,
  y: 0,
  rotate: 0,
  scale: 1,
};

const formShellVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 74,
    scale: 0.9,
    rotateX: 12,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: { duration: 1.05, ease: CONTACT_EASE, delay: 0.42 },
  },
};

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
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const headingInView = useInView(headingRef, { once: true, amount: 0.8 });
  const sceneInView = useInView(sceneRef, { once: true, amount: 0.3 });
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
  const renderAccentedText = (text: string, absoluteStart: number) =>
    text.split("").map((char, index) => {
      const absoluteIndex = absoluteStart + index;
      return (
        <span
          key={`${char}-${absoluteIndex}`}
          className={isAccentChar(absoluteIndex) ? "text-[#A01717]" : ""}
        >
          {char}
        </span>
      );
    });
  const typedMobileContactLineOne = typedHeading.slice(
    0,
    Math.min(typedHeading.length, mobileContactFirstLineLength),
  );
  const typedMobileContactLineTwo =
    typedHeading.length > mobileContactSecondLineStart
      ? typedHeading.slice(mobileContactSecondLineStart)
      : "";
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
      className="relative -scroll-mt-4 overflow-hidden bg-transparent py-12 sm:py-14 lg:py-16"
    >
      <div className="relative mx-auto w-full">
        <div className="mx-auto max-w-340 px-5 sm:px-7">
          <motion.div
            key={`contact-heading-${restartSignal}`}
            className="mx-auto max-w-150 text-center"
            initial={{ opacity: 0, y: 34 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.95, ease: "easeOut" }}
          >
            <h2
              className={`${instrumentSerif.className} text-[clamp(2.4rem,9.5vw,3.35rem)] leading-tight text-black/90 md:text-[clamp(1.62rem,4.5vw,2.7rem)]`}
            >
              <span ref={headingRef} className="inline-grid align-top">
                <span
                  className="col-start-1 row-start-1 invisible whitespace-pre-line md:hidden"
                  aria-hidden="true"
                >
                  {`${MOBILE_CONTACT_FIRST_LINE_TEXT}\n${MOBILE_CONTACT_SECOND_LINE_TEXT}`}
                </span>
                <span
                  className="col-start-1 row-start-1 invisible hidden md:inline"
                  aria-hidden="true"
                >
                  {CONTACT_HEADING_TEXT}
                </span>
                <span className="col-start-1 row-start-1 whitespace-pre-line md:hidden">
                  <span className="relative mx-auto block w-fit px-10 sm:px-0">
                    <motion.span
                      key={`contact-mobile-left-arm-${restartSignal}`}
                      className="pointer-events-none absolute left-[calc(50%-50vw)] top-1/2 block -translate-y-[46%] sm:hidden"
                      initial={mobileHeadingLeftArmInitial}
                      animate={headingInView ? mobileHeadingArmInView : false}
                      transition={{
                        duration: 1.2,
                        ease: CONTACT_EASE,
                        delay: 0.12,
                      }}
                    >
                      <span className="relative block aspect-[1.9/1] w-[clamp(7.75rem,36vw,12rem)]">
                        <Image
                          src={resolveOptimizedCloudinaryPublicAsset(
                            "/contact/left_arm.webp",
                            {
                              width: 640,
                              crop: "limit",
                              quality: "auto:good",
                            },
                          )}
                          alt="Left reaching hand artwork"
                          fill
                          className="object-contain object-left"
                          sizes="(max-width: 640px) 42vw, 0px"
                        />
                      </span>
                    </motion.span>
                    {renderAccentedText(typedMobileContactLineOne, 0)}
                    <motion.span
                      key={`contact-mobile-right-arm-${restartSignal}`}
                      className="pointer-events-none absolute right-[calc(50%-50vw)] top-1/2 block -translate-y-[46%] sm:hidden"
                      initial={mobileHeadingRightArmInitial}
                      animate={headingInView ? mobileHeadingArmInView : false}
                      transition={{
                        duration: 1.2,
                        ease: CONTACT_EASE,
                        delay: 0.16,
                      }}
                    >
                      <span className="relative block aspect-[1.9/1] w-[clamp(7.75rem,36vw,12rem)]">
                        <Image
                          src={resolveOptimizedCloudinaryPublicAsset(
                            "/contact/right_arm.webp",
                            {
                              width: 640,
                              crop: "limit",
                              quality: "auto:good",
                            },
                          )}
                          alt="Right reaching hand artwork"
                          fill
                          className="object-contain object-right"
                          sizes="(max-width: 640px) 42vw, 0px"
                        />
                      </span>
                    </motion.span>
                  </span>
                  <span className="block">
                    {renderAccentedText(
                      typedMobileContactLineTwo,
                      mobileContactSecondLineStart,
                    )}
                    <span className="hero-caret" aria-hidden="true" />
                  </span>
                </span>
                <span className="col-start-1 row-start-1 hidden md:inline">
                  {renderAccentedText(typedHeading, 0)}
                  <span className="hero-caret" aria-hidden="true" />
                </span>
              </span>
            </h2>
          </motion.div>
        </div>

        <div
          ref={sceneRef}
          className="relative mt-7 min-h-[clamp(16rem,35vw,30rem)] w-full sm:mt-9"
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden items-center sm:flex">
            <motion.div
              key={`contact-left-arm-${restartSignal}`}
              className="relative -translate-y-[20%] aspect-[1.9/1] w-[clamp(13rem,42vw,48rem)]"
              variants={leftArmVariants}
              initial="hidden"
              animate={sceneInView ? "show" : false}
            >
              <Image
                src={resolveOptimizedCloudinaryPublicAsset(
                  "/contact/left_arm.webp",
                  {
                    width: 1200,
                    crop: "limit",
                    quality: "auto:good",
                  },
                )}
                alt="Left reaching hand artwork"
                fill
                className="object-contain object-left"
                sizes="(max-width: 640px) 46vw, (max-width: 1024px) 46vw, 42vw"
              />
            </motion.div>
          </div>

          <div className="pointer-events-none absolute inset-y-0 right-0 hidden items-center sm:flex">
            <motion.div
              key={`contact-right-arm-${restartSignal}`}
              className="relative -translate-y-[20%] aspect-[1.9/1] w-[clamp(13rem,42vw,48rem)]"
              variants={rightArmVariants}
              initial="hidden"
              animate={sceneInView ? "show" : false}
            >
              <Image
                src={resolveOptimizedCloudinaryPublicAsset(
                  "/contact/right_arm.webp",
                  {
                    width: 1200,
                    crop: "limit",
                    quality: "auto:good",
                  },
                )}
                alt="Right reaching hand artwork"
                fill
                className="object-contain object-right"
                sizes="(max-width: 640px) 46vw, (max-width: 1024px) 46vw, 42vw"
              />
            </motion.div>
          </div>

          <div
            className="relative z-10 mx-auto flex w-full justify-center px-5 md:px-[clamp(5rem,21vw,27rem)]"
            style={{ perspective: 1200 }}
          >
            <motion.div
              key={`contact-form-${restartSignal}`}
              className={`${interClassName} relative w-full max-w-[24.5rem] rounded-[1.25rem] border border-black/8 bg-[#f5f5f3] p-4 md:max-w-88 md:p-3.5 lg:scale-110 lg:origin-top`}
              variants={formShellVariants}
              initial="hidden"
              animate={sceneInView ? "show" : false}
            >
              <motion.div
                className="pointer-events-none absolute inset-y-0 left-0 z-20 w-20 -translate-x-full bg-linear-to-r from-transparent via-white/58 to-transparent blur-md"
                initial={{ x: "-140%", opacity: 0 }}
                animate={
                  sceneInView
                    ? { x: ["-140%", "300%"], opacity: [0, 0.76, 0] }
                    : false
                }
                transition={{
                  duration: 1.22,
                  ease: "easeOut",
                  delay: 0.66,
                }}
              />
              <div className="relative -mx-4 -mt-4 overflow-hidden rounded-t-[1.25rem] px-4 py-4 md:-mx-3.5 md:-mt-3.5 md:px-3.5 md:py-3.5">
                <div className="pointer-events-none absolute inset-0">
                  <Image
                    src={resolveOptimizedCloudinaryPublicAsset(
                      "/contact/contact.webp",
                      {
                        width: 768,
                        crop: "limit",
                        quality: "auto:good",
                      },
                    )}
                    alt=""
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 640px) 100vw, 24rem"
                  />
                  <div className="absolute inset-0 bg-black/24" />
                </div>
                <h2
                  className={`${interClassName} relative z-10 text-center text-[1.55rem] font-semibold tracking-[0.01em] text-white md:text-[clamp(0.84rem,1.08vw,0.98rem)]`}
                >
                  Contact Us
                </h2>
              </div>
              <form
                ref={formRef}
                onSubmit={handleSubmit}
                noValidate
                className="mx-auto mt-3 w-full max-w-none space-y-3 md:mt-2 md:max-w-[20rem] md:space-y-2"
              >
                <div>
                  <label
                    htmlFor="contact-name"
                    className="mb-1.5 block text-[0.72rem] font-semibold tracking-[0.08em] text-black/63 uppercase md:mb-1 md:text-[0.54rem]"
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
                    className={`w-full rounded-full bg-white/90 px-4 py-2.75 text-[0.96rem] text-black shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] outline-none transition-all duration-200 placeholder:text-black/34 focus:ring-2 md:px-3 md:py-1.75 md:text-[0.64rem] ${
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
                    className="mb-1.5 block text-[0.72rem] font-semibold tracking-[0.08em] text-black/63 uppercase md:mb-1 md:text-[0.54rem]"
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
                    className={`w-full rounded-full bg-white/90 px-4 py-2.75 text-[0.96rem] text-black shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] outline-none transition-all duration-200 placeholder:text-black/34 focus:ring-2 md:px-3 md:py-1.75 md:text-[0.64rem] ${
                      emailStatus === "invalid"
                        ? "border border-red-500/85 focus:border-red-500 focus:ring-red-500/20"
                        : emailStatus === "valid"
                          ? "border border-emerald-500/70 focus:border-emerald-500 focus:ring-emerald-500/18"
                          : "border border-black/30 focus:border-black/48 focus:ring-black/12"
                    }`}
                  />
                  <p
                    className={`mt-1 min-h-[1rem] text-[0.64rem] md:min-h-[0.8rem] md:text-[0.52rem] ${
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
                    className="mb-1.5 block text-[0.72rem] font-semibold tracking-[0.08em] text-black/63 uppercase md:mb-1 md:text-[0.54rem]"
                  >
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    placeholder="Drop your suggestion, feedback, or anything else..."
                    value={messageValue}
                    onChange={handleMessageChange}
                    onBlur={() => setMessageInteracted(true)}
                    className={`w-full resize-none rounded-2xl bg-white/90 px-4 py-2.75 text-[0.96rem] text-black shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] outline-none transition-all duration-200 placeholder:text-black/34 focus:ring-2 md:px-3 md:py-1.75 md:text-[0.64rem] ${
                      messageStatus === "empty"
                        ? "border border-red-500/85 focus:border-red-500 focus:ring-red-500/20"
                        : "border border-black/30 focus:border-black/48 focus:ring-black/12"
                    }`}
                  />
                  <p className="mt-1.5 text-right text-[0.64rem] text-black/46 md:mt-1.25 md:text-[0.52rem]">
                    {wordsLeft} words left
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSending}
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full outline outline-[#A01717] bg-transparent px-4 py-2.75 text-[0.98rem] tracking-[0.02em] text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#a01717] hover:text-white disabled:cursor-not-allowed disabled:opacity-70 md:py-1.75 md:text-[0.62rem] md:tracking-[0.04em]"
                >
                  <span>{isSending ? "Sending..." : "Send Message"}</span>
                  <span aria-hidden="true">&gt;</span>
                </button>

                <p
                  className={`min-h-[1rem] text-[0.64rem] leading-5 md:min-h-[0.9rem] md:text-[0.54rem] md:leading-4 ${
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
