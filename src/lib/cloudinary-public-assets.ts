import cloudinaryPublicAssets from "@/src/config/cloudinary-public-assets.json";
import { buildOptimizedCloudinaryUrl } from "@/src/lib/cloudinary";

const publicAssetMap = cloudinaryPublicAssets as Record<string, string>;

export function resolveCloudinaryPublicAsset(path: string) {
  return publicAssetMap[path] ?? path;
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
