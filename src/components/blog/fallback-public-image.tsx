"use client";

import Image from "next/image";
import { useState } from "react";

type FallbackPublicImageProps = {
  src: string;
  fallbackSrc: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

export function FallbackPublicImage({
  src,
  fallbackSrc,
  alt,
  width,
  height,
  className,
}: FallbackPublicImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
