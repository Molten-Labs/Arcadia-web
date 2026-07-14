"use client";

import { useRef, useEffect } from "react";

interface TextSwapProps {
  children: string;
  className?: string;
}

function usePrefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  return mq.matches;
}

export function TextSwap({ children, className }: TextSwapProps) {
  const ref  = useRef<HTMLSpanElement>(null);
  const prev = useRef(children);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || prev.current === children) return;

    if (reduced) {
      el.textContent = children;
      prev.current = children;
      return;
    }

    const dur = 150;
    el.classList.add("is-exit");

    const t = setTimeout(() => {
      el.textContent = children;
      prev.current   = children;
      el.classList.remove("is-exit");
      el.classList.add("is-enter-start");
      void el.offsetHeight;
      el.classList.remove("is-enter-start");
    }, dur);

    return () => clearTimeout(t);
  }, [children, reduced]);

  return (
    <span
      ref={ref}
      className={`t-text-swap${className ? ` ${className}` : ""}`}
    >
      {children}
    </span>
  );
}
