import { redirect } from "next/navigation";
import { DEFAULT_LOCALE } from "@/lib/i18n";

/** A static export has no middleware, so `/` is a real page that redirects. */
export default function RootPage() {
  redirect(`/${DEFAULT_LOCALE}/`);
}
