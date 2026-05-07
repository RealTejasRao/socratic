"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export interface StaggeredMenuItem {
  label: string;
  ariaLabel: string;
  link: string;
}

type StaggeredMenuProps = {
  items: StaggeredMenuItem[];
  closeOnClickAway?: boolean;
  className?: string;
};

export function StaggeredMenu({
  items,
  closeOnClickAway = true,
  className,
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
        className="inline-flex h-7.5 min-w-17 cursor-pointer items-center justify-center bg-white/92 px-4 text-[0.75rem] font-medium tracking-[0.02em] text-black/80 backdrop-blur-md transition-all duration-250 hover:-translate-y-0.5 hover:bg-black hover:text-white"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="staggered-menu-panel"
      >
        <span>{open ? "Close" : "+ Menu"}</span>
      </button>

      {renderPanel ? (
        <div
          className={`fixed inset-0 z-[70] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
          aria-hidden={!open}
        >
          <div
            ref={layersRef}
            className="pointer-events-none absolute inset-y-0 right-0 z-[5] h-screen w-[min(26rem,92vw)]"
          >
            <div className="sm-prelayer absolute inset-0 bg-black" />
            <div className="sm-prelayer absolute inset-0 bg-neutral-900" />
          </div>

          <aside
            id="staggered-menu-panel"
            ref={panelRef}
            className="absolute inset-y-0 right-0 z-[10] flex h-screen w-[min(24rem,90vw)] flex-col overflow-y-auto border-l border-black/10 bg-white px-5 pb-6 pt-20"
          >
            <button
              type="button"
              onClick={closeMenu}
              aria-label="Close menu"
              className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center border border-black/12 bg-white text-black transition-colors duration-200 hover:bg-black hover:text-white"
            >
              <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center">
                <span className="absolute h-0.5 w-3 rotate-45 bg-current" />
                <span className="absolute h-0.5 w-3 -rotate-45 bg-current" />
              </span>
            </button>

            <ul className="space-y-1.5">
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
                    className="group inline-flex items-baseline gap-3 text-black no-underline"
                  >
                    <span className="text-[0.72rem] tracking-[0.2em] text-black/38">
                      {(index + 1).toString().padStart(2, "0")}
                    </span>
                    <span className="sm-panel-itemLabel inline-block text-[clamp(1.35rem,5.6vw,2.2rem)] font-medium tracking-[-0.03em] transition-colors duration-200 group-hover:text-black/55">
                      {item.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-auto border-t border-black/10 pt-5">
              <p className="text-[0.72rem] leading-5.5 tracking-[0.02em] text-black/52">
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
