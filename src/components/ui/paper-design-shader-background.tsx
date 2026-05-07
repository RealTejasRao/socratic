"use client";

import { GrainGradient } from "@paper-design/shaders-react";

type GradientBackgroundProps = {
  theme?: "dark" | "light";
};

export function GradientBackground({ theme = "dark" }: GradientBackgroundProps) {
  const isLight = theme === "light";

  return (
    <div className="absolute inset-0 -z-10">
      <GrainGradient
        style={{ height: "100%", width: "100%" }}
        colorBack={isLight ? "hsl(45, 62%, 96%)" : "hsl(0, 0%, 0%)"}
        softness={isLight ? 0.68 : 0.76}
        intensity={isLight ? 0.34 : 0.45}
        noise={0}
        shape="corners"
        offsetX={0}
        offsetY={0}
        scale={1}
        rotation={0}
        speed={1}
        colors={
          isLight
            ? ["hsl(18, 94%, 72%)", "hsl(46, 97%, 70%)", "hsl(338, 82%, 74%)"]
            : [
                "hsl(14, 100%, 57%)",
                "hsl(45, 100%, 51%)",
                "hsl(340, 82%, 52%)",
              ]
        }
      />
    </div>
  );
}
