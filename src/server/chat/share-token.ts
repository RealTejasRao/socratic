import { createHmac, timingSafeEqual } from "node:crypto";

type SharePayload = {
  sessionId: string;
  v: 1;
};

function getShareSecret() {
  return (
    process.env["SHARE_TOKEN_SECRET"] ||
    process.env["CLERK_SECRET_KEY"] ||
    "local-socratic-share-secret"
  );
}

function encodeBase64Url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function decodeBase64Url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signValue(value: string) {
  return createHmac("sha256", getShareSecret()).update(value).digest("base64url");
}

export function createShareToken(sessionId: string) {
  const payload: SharePayload = {
    sessionId,
    v: 1,
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function readShareToken(token: string) {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload);

  const signatureBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as SharePayload;

    if (payload.v !== 1 || typeof payload.sessionId !== "string" || !payload.sessionId) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
