import { redirect } from "next/navigation";
import { ROUTES } from "@/src/lib/routes";

export default function NotificationsPage() {
  redirect(ROUTES.APP);
}
