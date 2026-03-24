"use client";

import { useEffect, useRef } from "react";

type Particle = {
  angle: number;
  speed: number;
};

type Pulse = {
  x: number;
  y: number;
  start: number;
  duration: number;
  maxRadius: number;
  particles: Particle[];
};

const PARTICLE_COUNT = 6;

export default function ClickPulse() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pulsesRef = useRef<Pulse[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;

    const draw = (now: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      pulsesRef.current = pulsesRef.current.filter((pulse) => {
        const t = (now - pulse.start) / pulse.duration;
        if (t >= 1) return false;

        const eased = t * t * (3 - 2 * t);
        const radius = eased * pulse.maxRadius;
        const alpha = 1 - t;

        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Dark ring-first effect for better visibility on bright surfaces.
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0,0,0,${0.8 * alpha})`;
        ctx.lineWidth = 1.85;
        ctx.arc(pulse.x, pulse.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = `rgba(255,255,255,${0.22 * alpha})`;
        ctx.lineWidth = 0.8;
        ctx.arc(pulse.x, pulse.y, Math.max(1, radius - 1.8), 0, Math.PI * 2);
        ctx.stroke();

        pulse.particles.forEach((particle) => {
          const pr = radius * particle.speed;
          const px = pulse.x + Math.cos(particle.angle) * pr;
          const py = pulse.y + Math.sin(particle.angle) * pr;
          const particleAlpha = Math.max(0, 0.9 - t * 1.1);

          ctx.beginPath();
          ctx.fillStyle = `rgba(0,0,0,${0.78 * particleAlpha})`;
          ctx.arc(px, py, 1.1, 0, Math.PI * 2);
          ctx.fill();
        });

        return true;
      });

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      // Left click/touch/pen only.
      if (event.button !== 0 && event.pointerType === "mouse") return;

      const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        angle: (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.25,
        speed: 0.55 + Math.random() * 0.7,
      }));

      pulsesRef.current.push({
        x: event.clientX,
        y: event.clientY,
        start: performance.now(),
        duration: 420,
        maxRadius: 26,
        particles,
      });
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[1000]"
      aria-hidden="true"
    />
  );
}
