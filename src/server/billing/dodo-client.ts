import "server-only";
import DodoPayments from "dodopayments";

let cachedClient: DodoPayments | null = null;

export function getDodoClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const bearerToken = process.env["DODO_PAYMENTS_API_KEY"];
  const environment =
    process.env["DODO_PAYMENTS_ENVIRONMENT"] === "test_mode"
      ? "test_mode"
      : "live_mode";

  if (!bearerToken) {
    throw new Error("DODO_PAYMENTS_API_KEY is not set");
  }

  cachedClient = new DodoPayments({
    bearerToken,
    environment,
    webhookKey: process.env["DODO_PAYMENTS_WEBHOOK_KEY"] ?? null,
  });

  return cachedClient;
}
