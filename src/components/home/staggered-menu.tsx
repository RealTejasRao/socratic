"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ArrowRight } from "lucide-react";

export interface StaggeredMenuItem {
  label: string;
  ariaLabel: string;
  link: string;
}

type StaggeredMenuProps = {
  items: StaggeredMenuItem[];
  closeOnClickAway?: boolean;
  className?: string;
  triggerVariant?: "text" | "hamburger";
};

export function StaggeredMenu({
  items,
  closeOnClickAway = true,
  className,
  triggerVariant = "text",
}: StaggeredMenuProps) {
  const [open, setOpen] = useState(false);
  const [renderPanel, setRenderPanel] = useState(false);
  const panelRef = useRef<HTMLElement | null>(null);
  const layersRef = useRef<HTMLDivElement | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);

  const openMenu = useCallback(() => {
    setRenderPanel(true);
    setOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  const toggleMenu = useCallback(() => {
    if (open) {
      closeMenu();
      return;
    }
    openMenu();
  }, [open, openMenu, closeMenu]);

  useLayoutEffect(() => {
    if (!renderPanel) return;

    const panel = panelRef.current;
    const layersHost = layersRef.current;
    if (!panel || !layersHost) return;

    const layers = Array.from(layersHost.querySelectorAll(".sm-prelayer")) as HTMLElement[];

    if (open) {
      gsap.killTweensOf([panel, ...layers]);
      gsap.set([panel, ...layers], { xPercent: 100 });
      const itemEls = Array.from(panel.querySelectorAll(".sm-panel-itemLabel")) as HTMLElement[];
      const firstLayer = layers[0];
      const secondLayer = layers[1];

      if (!firstLayer || !secondLayer) {
        return;
      }

      gsap.set(itemEls, { yPercent: 140, rotate: 10 });

      const tl = gsap.timeline();
      tl.to(firstLayer, { xPercent: 0, duration: 0.42, ease: "power4.out" }, 0);
      tl.to(secondLayer, { xPercent: 0, duration: 0.5, ease: "power4.out" }, 0.05);
      tl.to(panel, { xPercent: 0, duration: 0.6, ease: "power4.out" }, 0.1);
      tl.to(itemEls, { yPercent: 0, rotate: 0, duration: 0.65, stagger: 0.08, ease: "power4.out" }, 0.22);
      return;
    }

    const closeTl = gsap.timeline({
      onComplete: () => {
        setRenderPanel(false);
      },
    });
    closeTl.to([panel, ...layers], {
      xPercent: 100,
      duration: 0.28,
      ease: "power3.in",
    });
  }, [open, renderPanel]);

  useEffect(() => {
    if (!closeOnClickAway || !renderPanel) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (toggleBtnRef.current?.contains(target)) return;
      closeMenu();
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [closeOnClickAway, renderPanel, closeMenu]);

  return (
    <div className={`relative shrink-0 ${className ?? ""}`}>
      <button
        ref={toggleBtnRef}
        type="button"
        onClick={toggleMenu}
        className={
          triggerVariant === "hamburger"
            ? "inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-black/12 bg-white/95 text-black/85 shadow-[0_8px_24px_rgba(0,0,0,0.14)] backdrop-blur-md transition-all duration-250 hover:-translate-y-0.5 hover:bg-black hover:text-white md:rounded-none md:border-0 md:shadow-none"
            : "inline-flex h-7.5 min-w-17 cursor-pointer items-center justify-center bg-white/92 px-4 text-[0.75rem] font-medium tracking-[0.02em] text-black/80 backdrop-blur-md transition-all duration-250 hover:-translate-y-0.5 hover:bg-black hover:text-white"
        }
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="staggered-menu-panel"
      >
        {triggerVariant === "hamburger" ? (
          <span aria-hidden="true" className="relative inline-flex h-5 w-5 items-center justify-center">
            {open ? (
              <>
                <span className="absolute h-0.5 w-5 rotate-45 bg-current" />
                <span className="absolute h-0.5 w-5 -rotate-45 bg-current" />
              </>
            ) : (
              <>
                <span className="absolute top-0.5 h-0.5 w-5 bg-current" />
                <span className="absolute top-1/2 h-0.5 w-5 -translate-y-1/2 bg-current" />
                <span className="absolute bottom-0.5 h-0.5 w-5 bg-current" />
              </>
            )}
          </span>
        ) : (
          <span>{open ? "Close" : "+ Menu"}</span>
        )}
      </button>

      {renderPanel ? (
        <div
          className={`fixed inset-0 z-[70] bg-black/22 backdrop-blur-[1.5px] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
          aria-hidden={!open}
        >
          <div
            ref={layersRef}
            className="pointer-events-none absolute inset-y-0 right-0 z-[5] h-[100dvh] w-[min(22.5rem,84vw)] md:w-[min(26rem,92vw)]"
          >
            <div className="sm-prelayer absolute inset-0 bg-black" />
            <div className="sm-prelayer absolute inset-0 bg-black" />
          </div>

          <aside
            id="staggered-menu-panel"
            ref={panelRef}
            className="absolute inset-y-0 right-0 z-[10] flex h-[100dvh] w-[min(21.5rem,80vw)] flex-col overflow-y-auto border-l border-black/10 bg-white px-5 pb-6 pt-5 shadow-[-20px_0_44px_rgba(0,0,0,0.22)] md:w-[min(24rem,90vw)] md:bg-white md:px-5 md:pb-6 md:pt-20 md:shadow-none"
          >
            <div className="flex items-center justify-between border-b border-black/10 pb-3 md:absolute md:right-5 md:top-5 md:border-0 md:pb-0">
              <p className="text-[0.72rem] font-medium tracking-[0.16em] text-black/52 uppercase md:hidden">
                Menu
              </p>
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/12 bg-white text-black transition-colors duration-200 hover:bg-black hover:text-white md:rounded-none"
              >
                <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center">
                  <span className="absolute h-0.5 w-3 rotate-45 bg-current" />
                  <span className="absolute h-0.5 w-3 -rotate-45 bg-current" />
                </span>
              </button>
            </div>

            <ul className="mt-5 space-y-2 md:mt-0 md:space-y-1.5">
              {items.map((item, index) => (
                <li key={item.label + index} className="overflow-hidden">
                  <a
                    href={item.link}
                    aria-label={item.ariaLabel}
                    onClick={() => {
                      if (typeof window !== "undefined" && item.link.startsWith("#")) {
                        window.dispatchEvent(
                          new CustomEvent("section:typewriter:restart", {
                            detail: { sectionId: item.link.slice(1) },
                          })
                        );
                      }
                      closeMenu();
                    }}
                    className="group flex items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-black no-underline transition-colors duration-200 hover:border-[#a01717] md:inline-flex md:items-baseline md:gap-3 md:rounded-none md:border-0 md:bg-transparent md:px-0 md:py-0 md:hover:border-transparent md:hover:bg-transparent"
                  >
                    <span className="inline-flex items-baseline gap-3">
                      <span className="text-[0.68rem] tracking-[0.2em] text-[#a01717] md:text-[0.72rem]">
                        {(index + 1).toString().padStart(2, "0")}
                      </span>
                      <span className="sm-panel-itemLabel inline-block text-[clamp(1.6rem,8vw,2.25rem)] font-medium tracking-[-0.03em] transition-colors duration-200 group-hover:text-black/55 md:text-[clamp(1.35rem,5.6vw,2.2rem)]">
                        {item.label}
                      </span>
                    </span>
                    <span
                      className="text-[#a01717] md:hidden"
                      aria-hidden="true"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-auto border-t border-black/10 pt-5">
              <p className="text-[0.8rem] leading-6 tracking-[0.02em] text-black/55 md:text-[0.72rem] md:leading-5.5 md:text-black/52">
                Socratic AI
                <br />
                Your Personal AI for Philosophy.
              </p>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
