import { redirect } from "next/navigation";

// Reputation merged into /dashboard (Reputation tab). Soft-redirect preserves
// old links/bookmarks and any references without rendering a duplicate page.
export default function ReputationRedirect() {
  redirect("/dashboard");
}