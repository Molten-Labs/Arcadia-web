import { redirect } from "next/navigation";

// Manage Vault moved into the topbar wallet menu (ManageVaultModal). Soft-
// redirect preserves old links and any references; the wallet menu is the
// new always-available entry point for self-funding and deposits toggle.
export default function ManageRedirect() {
  redirect("/dashboard");
}