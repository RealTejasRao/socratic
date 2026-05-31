import cloudinaryPublicAssets from "@/src/config/cloudinary-public-assets.json";
import { buildOptimizedCloudinaryUrl } from "@/src/lib/cloudinary";

const publicAssetMap = cloudinaryPublicAssets as Record<string, string>;
const CLOUDINARY_UPLOAD_MARKER = "/image/upload/";
const DEFAULT_PUBLIC_ASSETS_PREFIX = "socratic/public-assets";

function getCloudinaryUploadBaseUrl() {
  const firstCloudinaryUrl = Object.values(publicAssetMap).find((value) =>
    value.includes(CLOUDINARY_UPLOAD_MARKER),
  );

  if (!firstCloudinaryUrl) {
    return null;
  }

  const markerIndex = firstCloudinaryUrl.indexOf(CLOUDINARY_UPLOAD_MARKER);
  if (markerIndex === -1) {
    return null;
  }

  return firstCloudinaryUrl.slice(
    0,
    markerIndex + CLOUDINARY_UPLOAD_MARKER.length,
  );
}

function resolveImplicitCloudinaryBlogImage(path: string) {
  if (!path.startsWith("/blog/images/")) {
    return null;
  }

  const uploadBaseUrl = getCloudinaryUploadBaseUrl();
  if (!uploadBaseUrl) {
    return null;
  }

  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${uploadBaseUrl}${DEFAULT_PUBLIC_ASSETS_PREFIX}/${normalizedPath}`;
}

export function resolveCloudinaryPublicAsset(path: string) {
  return publicAssetMap[path] ?? resolveImplicitCloudinaryBlogImage(path) ?? path;
}

export function resolveOptimizedCloudinaryPublicAsset(
  path: string,
  options?: {
    width?: number;
    height?: number;
    crop?: "fill" | "fit" | "limit";
    quality?: string;
  },
) {
  return buildOptimizedCloudinaryUrl(
    resolveCloudinaryPublicAsset(path),
    options,
  );
}
