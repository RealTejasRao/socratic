type CloudinaryCropMode = "fill" | "fit" | "limit";

export function buildOptimizedCloudinaryUrl(
  url: string,
  options?: {
    width?: number;
    height?: number;
    crop?: CloudinaryCropMode;
    quality?: string;
  },
) {
  if (!url) {
    return url;
  }

  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  if (parsed.hostname !== "res.cloudinary.com") {
    return url;
  }

  const marker = "/image/upload/";
  const markerIndex = parsed.pathname.indexOf(marker);

  if (markerIndex === -1) {
    return url;
  }

  const transformationParts = [
    "f_auto",
    `q_${options?.quality ?? "auto:good"}`,
    "dpr_auto",
  ];

  if (options?.crop) {
    transformationParts.push(`c_${options.crop}`);
  }

  if (typeof options?.width === "number" && options.width > 0) {
    transformationParts.push(`w_${Math.round(options.width)}`);
  }

  if (typeof options?.height === "number" && options.height > 0) {
    transformationParts.push(`h_${Math.round(options.height)}`);
  }

  const prefix = parsed.pathname.slice(0, markerIndex + marker.length);
  const suffix = parsed.pathname.slice(markerIndex + marker.length);

  if (!suffix) {
    return url;
  }

  parsed.pathname = `${prefix}${transformationParts.join(",")}/${suffix}`;

  return parsed.toString();
}

export function buildChatAttachmentThumbnailUrl(url: string) {
  return buildOptimizedCloudinaryUrl(url, {
    width: 224,
    height: 224,
    crop: "fill",
  });
}

export function buildChatAttachmentPreviewUrl(url: string) {
  return buildOptimizedCloudinaryUrl(url, {
    width: 1600,
    crop: "limit",
  });
}
