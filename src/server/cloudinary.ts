import { v2 as cloudinary } from "cloudinary";

type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

let cachedCloudinaryConfig: CloudinaryConfig | null = null;

function getCloudinaryConfig() {
  if (cachedCloudinaryConfig) {
    return cachedCloudinaryConfig;
  }

  const cloudName = process.env["CLOUDINARY_CLOUD_NAME"];
  const apiKey = process.env["CLOUDINARY_API_KEY"];
  const apiSecret = process.env["CLOUDINARY_API_SECRET"];

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured. Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET.");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  cachedCloudinaryConfig = {
    cloudName,
    apiKey,
    apiSecret,
  };

  return cachedCloudinaryConfig;
}

export function createCloudinaryUploadSignature(paramsToSign: Record<string, string | number>) {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

  return {
    cloudName,
    apiKey,
    signature,
  };
}
