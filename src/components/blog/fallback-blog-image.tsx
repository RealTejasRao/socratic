"use client";

import Image from "next/image";
import { useState } from "react";

type FallbackBlogImageProps = {
  src: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
  sizes?: string;
};

export function FallbackBlogImage({
  src,
  fallbackSrc,
  alt,
  className,
  sizes,
}: FallbackBlogImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    <Image
      src={currentSrc}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}
