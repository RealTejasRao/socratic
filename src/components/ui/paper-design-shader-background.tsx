"use client";

import { GrainGradient } from "@paper-design/shaders-react";

export function GradientBackground() {
  return (
    <div className="absolute inset-0 -z-10">
      <GrainGradient
        style={{ height: "100%", width: "100%" }}
        colorBack="hsl(42, 60%, 97%)"
        softness={0.76}
        intensity={0.45}
        noise={0}
        shape="corners"
        offsetX={0}
        offsetY={0}
        scale={1}
        rotation={0}
        speed={3}
        colors={[
          "hsl(205, 85%, 78%)",
          "hsl(42, 100%, 80%)",
          "hsl(332, 68%, 82%)",
        ]}
      />
    </div>
  );
}
