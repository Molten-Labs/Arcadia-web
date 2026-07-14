import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { MobileNav } from "@/components/shell/MobileNav";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";

/**
 * Shell for authenticated app routes (sidebar + topbar + mobile bar). The
 * landing at `/` lives outside this group and renders its own nav/footer
 * full-bleed.
 */
export const metadata: Metadata = {
  title: {
    template: "%s | Arcadia",
    default: "Arcadia",
  },
};

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <AppShell>
        <Topbar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </AppShell>
      <MobileNav />
    </div>
  );
}
