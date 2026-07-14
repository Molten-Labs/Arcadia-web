"use client";

import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

import { AcidButton } from "@/components/acid";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-void px-6">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, color-mix(in srgb, var(--color-danger) 7%, transparent) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 text-center">
        <div className="mb-6 mx-auto flex size-16 items-center justify-center rounded-full border border-danger/25 bg-danger/10">
          <span className="text-2xl">!</span>
        </div>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-danger/25 bg-danger/[0.05] px-3.5 py-1.5 font-mono text-[0.64rem] font-bold tracking-[0.18em] text-danger uppercase">
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full bg-danger"
          />
          Something went wrong
        </div>

        <p className="mx-auto mb-8 max-w-sm text-sm leading-relaxed text-muted">
          {error.message || "An unexpected error occurred."}
        </p>

        <div className="flex items-center justify-center gap-3">
          <AcidButton variant="ghost" size="sm" onClick={() => window.location.href = "/"}>
            <ArrowLeft aria-hidden />
            Back home
          </AcidButton>
          <AcidButton variant="acid" size="sm" onClick={reset}>
            Try again
          </AcidButton>
        </div>
      </div>
    </div>
  );
}
