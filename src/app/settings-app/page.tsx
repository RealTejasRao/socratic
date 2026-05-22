import { redirect } from "next/navigation";
import { ROUTES } from "@/src/lib/routes";

export default function SettingsAppPage() {
  redirect(ROUTES.APP);
}
