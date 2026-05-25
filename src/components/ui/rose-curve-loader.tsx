"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/src/lib/utils";

type RoseCurveLoaderProps = {
  className?: string;
};

const CONFIG = {
  rotate: true,
  particleCount: 26,
  trailSpan: 0.14,
  durationMs: 5400,
  rotationDurationMs: 28000,
  pulseDurationMs: 4600,
  roseA: 9.2,
  roseABoost: 0.6,
  roseBreathBase: 0.72,
  roseBreathBoost: 0.28,
  roseK: 5,
  roseScale: 3.25,
};

function normalizeProgress(progress: number) {
  return ((progress % 1) + 1) % 1;
}

function getDetailScale(time: number) {
  const pulseProgress = (time % CONFIG.pulseDurationMs) / CONFIG.pulseDurationMs;
  const pulseAngle = pulseProgress * Math.PI * 2;
  return 0.52 + ((Math.sin(pulseAngle + 0.55) + 1) / 2) * 0.48;
}

function getRotation(time: number) {
  if (!CONFIG.rotate) {
    return 0;
  }

  return -((time % CONFIG.rotationDurationMs) / CONFIG.rotationDurationMs) * 360;
}

function point(progress: number, detailScale: number) {
  const t = progress * Math.PI * 2;
  const a = CONFIG.roseA + detailScale * CONFIG.roseABoost;
  const r =
    a *
    (CONFIG.roseBreathBase + detailScale * CONFIG.roseBreathBoost) *
    Math.cos(Math.round(CONFIG.roseK) * t);

  return {
    x: 50 + Math.cos(t) * r * CONFIG.roseScale,
    y: 50 + Math.sin(t) * r * CONFIG.roseScale,
  };
}

function buildPath(detailScale: number, steps = 220) {
  return Array.from({ length: steps + 1 }, (_, index) => {
    const currentPoint = point(index / steps, detailScale);
    return `${index === 0 ? "M" : "L"} ${currentPoint.x.toFixed(2)} ${currentPoint.y.toFixed(2)}`;
  }).join(" ");
}

function getParticle(index: number, progress: number, detailScale: number) {
  const tailOffset = index / (CONFIG.particleCount - 1);
  const currentPoint = point(
    normalizeProgress(progress - tailOffset * CONFIG.trailSpan),
    detailScale,
  );
  const fade = Math.pow(1 - tailOffset, 0.56);

  return {
    x: currentPoint.x,
    y: currentPoint.y,
    radius: 0.9 + fade * 2.4,
    opacity: 0.08 + fade * 0.92,
  };
}

export function RoseCurveLoader({ className }: RoseCurveLoaderProps) {
  const groupRef = useRef<SVGGElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const particleRefs = useRef<Array<SVGCircleElement | null>>([]);

  useEffect(() => {
    const group = groupRef.current;
    const path = pathRef.current;
    if (!group || !path) {
      return;
    }

    let frameId = 0;
    const startedAt = performance.now();

    const render = (now: number) => {
      const time = now - startedAt;
      const progress = (time % CONFIG.durationMs) / CONFIG.durationMs;
      const detailScale = getDetailScale(time);

      group.setAttribute("transform", `rotate(${getRotation(time)} 50 50)`);
      path.setAttribute("d", buildPath(detailScale));

      particleRefs.current.forEach((node, index) => {
        if (!node) {
          return;
        }

        const particle = getParticle(index, progress, detailScale);
        node.setAttribute("cx", particle.x.toFixed(2));
        node.setAttribute("cy", particle.y.toFixed(2));
        node.setAttribute("r", particle.radius.toFixed(2));
        node.setAttribute("opacity", particle.opacity.toFixed(3));
      });

      frameId = window.requestAnimationFrame(render);
    };

    frameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex h-[2.3em] w-[2.3em] shrink-0 text-current [filter:drop-shadow(0_0_1px_rgba(0,0,0,0.92))_drop-shadow(0_0_1px_rgba(255,255,255,0.92))]",
        className,
      )}
    >
      <svg viewBox="0 0 100 100" fill="none" className="h-full w-full overflow-visible">
        <g ref={groupRef}>
          <path
            ref={pathRef}
            stroke="currentColor"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.16"
          />
          {Array.from({ length: CONFIG.particleCount }, (_, index) => (
            <circle
              key={index}
              ref={(node) => {
                particleRefs.current[index] = node;
              }}
              fill="currentColor"
            />
          ))}
        </g>
      </svg>
    </span>
  );
}
