"use client";

import {
  FC,
  PointerEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

interface CurvedLoopProps {
  marqueeText?: string;
  speed?: number;
  className?: string;
  curveAmount?: number;
  direction?: "left" | "right";
  interactive?: boolean;
}

const CurvedLoop: FC<CurvedLoopProps> = ({
  marqueeText = "",
  speed = 2,
  className,
  curveAmount = 400,
  direction = "left",
  interactive = true,
}) => {
  const text = useMemo(() => {
    const hasTrailing = /\s|\u00A0$/.test(marqueeText);
    return (
      (hasTrailing ? marqueeText.replace(/\s+$/, "") : marqueeText) + "\u00A0"
    );
  }, [marqueeText]);

  const measureRef = useRef<SVGTextElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const textPathRef = useRef<SVGTextPathElement | null>(null);
  const [spacing, setSpacing] = useState(0);
  const [pathLength, setPathLength] = useState(1800);
  const offsetRef = useRef(0);
  const uid = useId();
  const pathId = `curve-${uid}`;
  const pathD = `M-100,40 Q720,${40 + curveAmount} 1540,40`;

  const dragRef = useRef(false);
  const lastXRef = useRef(0);
  const dirRef = useRef<"left" | "right">(direction);
  const velRef = useRef(0);

  const textLength = spacing;
  const repeatCount = textLength
    ? Math.ceil((pathLength + textLength) / textLength) + 3
    : 1;
  const totalText = textLength ? Array(repeatCount).fill(text).join("") : text;
  const ready = spacing > 0;

  const normalizeOffset = (value: number, wrapPoint: number) => {
    if (!wrapPoint) return value;
    let normalized = value;
    while (normalized <= -wrapPoint) normalized += wrapPoint;
    while (normalized > 0) normalized -= wrapPoint;
    return normalized;
  };

  const applyOffset = (value: number, wrapPoint: number) => {
    const normalized = normalizeOffset(value, wrapPoint);
    offsetRef.current = normalized;
    if (textPathRef.current) {
      textPathRef.current.setAttribute("startOffset", `${normalized}px`);
    }
  };

  useEffect(() => {
    if (measureRef.current)
      setSpacing(measureRef.current.getComputedTextLength());
  }, [text, className]);

  useEffect(() => {
    const updatePathLength = () => {
      if (!pathRef.current) return;
      setPathLength(pathRef.current.getTotalLength());
    };

    updatePathLength();
    window.addEventListener("resize", updatePathLength);
    return () => window.removeEventListener("resize", updatePathLength);
  }, [curveAmount]);

  useEffect(() => {
    if (!spacing) return;
    if (textPathRef.current) {
      const initial = offsetRef.current === 0 ? -spacing : offsetRef.current;
      applyOffset(initial, spacing);
    }
  }, [spacing]);

  useEffect(() => {
    if (!spacing || !ready) return;
    let frame = 0;
    const step = () => {
      if (!dragRef.current && textPathRef.current) {
        const delta = dirRef.current === "right" ? speed : -speed;
        const newOffset = offsetRef.current + delta;
        applyOffset(newOffset, spacing);
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [spacing, speed, ready]);

  const onPointerDown = (event: PointerEvent) => {
    if (!interactive) return;
    dragRef.current = true;
    lastXRef.current = event.clientX;
    velRef.current = 0;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!interactive || !dragRef.current || !textPathRef.current) return;
    const dx = event.clientX - lastXRef.current;
    lastXRef.current = event.clientX;
    velRef.current = dx;
    const newOffset = offsetRef.current + dx;
    applyOffset(newOffset, spacing);
  };

  const endDrag = () => {
    if (!interactive) return;
    dragRef.current = false;
    dirRef.current = velRef.current > 0 ? "right" : "left";
  };

  const cursorStyle = interactive
    ? dragRef.current
      ? "grabbing"
      : "grab"
    : "auto";

  return (
    <div
      className="w-full"
      style={{ visibility: ready ? "visible" : "hidden", cursor: cursorStyle }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
    >
      <svg
        className="block aspect-100/18 w-full select-none overflow-visible text-[1.1rem] font-bold uppercase leading-none sm:text-[2.4rem]"
        viewBox="0 0 1440 120"
      >
        <text
          ref={measureRef}
          xmlSpace="preserve"
          style={{ visibility: "hidden", opacity: 0, pointerEvents: "none" }}
        >
          {text}
        </text>
        <defs>
          <path
            ref={pathRef}
            id={pathId}
            d={pathD}
            fill="none"
            stroke="transparent"
          />
        </defs>
        {ready ? (
          <text xmlSpace="preserve" className={className ?? ""}>
            <textPath
              ref={textPathRef}
              href={`#${pathId}`}
              startOffset="0px"
              xmlSpace="preserve"
            >
              {totalText}
            </textPath>
          </text>
        ) : null}
      </svg>
    </div>
  );
};

export default CurvedLoop;
