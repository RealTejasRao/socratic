import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { v2 as cloudinary } from "cloudinary";

const workspaceRoot = process.cwd();
const targetRelativeDir = process.argv[2] ?? "public";
const targetAbsoluteDir = path.resolve(workspaceRoot, targetRelativeDir);
const outputFile = path.resolve(
  workspaceRoot,
  "src/config/cloudinary-public-assets.json",
);

async function hydrateEnvFromFile(fileName) {
  const filePath = path.resolve(workspaceRoot, fileName);

  try {
    const content = await fs.readFile(filePath, "utf8");
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const eqIndex = trimmed.indexOf("=");
      if (eqIndex <= 0) continue;

      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // ignore missing env files
  }
}

await hydrateEnvFromFile(".env.local");
await hydrateEnvFromFile(".env");

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const baseFolder =
  process.env.CLOUDINARY_PUBLIC_ASSETS_FOLDER ?? "socratic/public-assets";

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error(
    "Missing Cloudinary env vars. Expected CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.",
  );
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

async function listFilesRecursive(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listFilesRecursive(fullPath);
      }
      return [fullPath];
    }),
  );

  return nested.flat();
}

function normalizeToLocalMediaPath(fullFilePath) {
  const relativeFromPublic = path.relative(
    path.resolve(workspaceRoot, "public"),
    fullFilePath,
  );
  return `/${relativeFromPublic.split(path.sep).join("/")}`;
}

function toCloudinaryPublicId(fullFilePath) {
  const relativeFromPublic = path.relative(
    path.resolve(workspaceRoot, "public"),
    fullFilePath,
  );
  const noExt = relativeFromPublic.replace(
    path.extname(relativeFromPublic),
    "",
  );
  return `${baseFolder}/${noExt.split(path.sep).join("/")}`;
}

async function loadExistingMap() {
  try {
    const content = await fs.readFile(outputFile, "utf8");
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {}

  return {};
}

function isImageFile(filePath) {
  return /\.(png|jpe?g|webp|avif|gif|svg|ico)$/i.test(filePath);
}

async function main() {
  const stat = await fs.stat(targetAbsoluteDir);
  if (!stat.isDirectory()) {
    throw new Error(`Target path is not a directory: ${targetRelativeDir}`);
  }

  const existing = await loadExistingMap();
  const files = (await listFilesRecursive(targetAbsoluteDir)).filter(
    isImageFile,
  );

  if (files.length === 0) {
    console.log(`No image files found in ${targetRelativeDir}`);
    return;
  }

  const nextMap = { ...existing };
  const failedUploads = [];

  for (const fullFilePath of files) {
    const localPath = normalizeToLocalMediaPath(fullFilePath);
    const publicId = toCloudinaryPublicId(fullFilePath);

    try {
      const uploadResult = await cloudinary.uploader.upload(fullFilePath, {
        public_id: publicId,
        overwrite: true,
        resource_type: "image",
        invalidate: true,
        use_filename: false,
        unique_filename: false,
      });

      nextMap[localPath] = uploadResult.secure_url;
      console.log(`Uploaded: ${localPath} -> ${uploadResult.secure_url}`);
      continue;
    } catch (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? String(error.message)
          : "";

      if (!/file size too large/i.test(message)) {
        failedUploads.push({
          localPath,
          reason: message || "Unknown upload failure",
        });
        console.error(
          `Failed: ${localPath} (${message || "Unknown upload failure"})`,
        );
        continue;
      }
    }

    try {
      const sharpModule = await import("sharp");
      const sharp = sharpModule.default;
      const resizeWidths = [3200, 2800, 2400];
      let uploaded = false;

      for (const width of resizeWidths) {
        const tempFile = path.join(
          os.tmpdir(),
          `socratic-cloudinary-${Date.now()}-${Math.random().toString(16).slice(2)}.webp`,
        );

        try {
          await sharp(fullFilePath)
            .rotate()
            .resize({ width, withoutEnlargement: true })
            .webp({ quality: 95, effort: 6 })
            .toFile(tempFile);

          const uploadResult = await cloudinary.uploader.upload(tempFile, {
            public_id: publicId,
            overwrite: true,
            resource_type: "image",
            invalidate: true,
            use_filename: false,
            unique_filename: false,
          });

          nextMap[localPath] = uploadResult.secure_url;
          uploaded = true;
          console.log(
            `Uploaded (optimized fallback): ${localPath} -> ${uploadResult.secure_url}`,
          );
          break;
        } catch {
          // try smaller width fallback
        } finally {
          await fs.rm(tempFile, { force: true });
        }
      }

      if (!uploaded) {
        failedUploads.push({
          localPath,
          reason: "Could not upload after high-quality fallback optimization.",
        });
        console.error(
          `Failed: ${localPath} (Could not upload after fallback optimization)`,
        );
      }
    } catch {
      failedUploads.push({
        localPath,
        reason:
          "File exceeds Cloudinary size limit and sharp optimization is unavailable.",
      });
      console.error(
        `Failed: ${localPath} (oversized and no optimizer available)`,
      );
    }
  }

  const sortedKeys = Object.keys(nextMap).sort((a, b) => a.localeCompare(b));
  const sortedMap = Object.fromEntries(
    sortedKeys.map((key) => [key, nextMap[key]]),
  );

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(
    outputFile,
    `${JSON.stringify(sortedMap, null, 2)}\n`,
    "utf8",
  );

  console.log(
    `\nUpdated mapping file: ${path.relative(workspaceRoot, outputFile)}`,
  );

  if (failedUploads.length > 0) {
    console.log("\nSome assets were not uploaded:");
    for (const failure of failedUploads) {
      console.log(`- ${failure.localPath}: ${failure.reason}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
