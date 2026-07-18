import { redirect } from "next/navigation";

// Analytics merged into /dashboard (Performance tab). Soft-redirect preserves
// old links/bookmarks and any references without rendering a duplicate page.
export default function AnalyticsRedirect() {
  redirect("/dashboard");
}