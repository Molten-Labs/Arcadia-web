import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-16 w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-sm text-ink placeholder:text-faint",
        "outline-none transition-colors",
        "focus-visible:border-acid/50 focus-visible:ring-2 focus-visible:ring-acid/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "field-sizing-content",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
