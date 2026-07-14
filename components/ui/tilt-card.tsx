"use client";

import { useRef, useCallback, useState } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

interface TiltCardProps {
  children:    React.ReactNode;
  className?:  string;
  glare?:      boolean;
  maxTilt?:    number;
  perspective?: number;
  scale?:      number;
  speed?:      number;
}

export function TiltCard({
  children,
  className,
  glare = true,
  maxTilt = 10,
  perspective = 1000,
  scale = 1.02,
  speed = 400,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isTilting, setIsTilting] = useState(false);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.setProperty("--tilt-rx", `${(y - 0.5) * -maxTilt}deg`);
      el.style.setProperty("--tilt-ry", `${(x - 0.5) * maxTilt}deg`);
      setGlarePos({ x: x * 100, y: y * 100 });
      setIsTilting(true);
    },
    [maxTilt],
  );

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tilt-rx", "0deg");
    el.style.setProperty("--tilt-ry", "0deg");
    setIsTilting(false);
  }, []);

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={{ scale }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ perspective }}
      className={cn(
        "t-tilt relative transform-gpu",
        "will-change-[transform]",
        className,
      )}
    >
      <div
        className={cn(
          "t-tilt-card relative rounded-[inherit]",
          "transition-transform duration-[var(--tilt-speed,400ms)] ease-out motion-reduce:transition-none",
          isTilting && "is-tilting",
        )}
        style={{
          transform:
            "rotateX(var(--tilt-rx,0deg)) rotateY(var(--tilt-ry,0deg))",
          // @ts-expect-error CSS custom property
          "--tilt-speed": `${speed}ms`,
        }}
      >
        {children}
        {glare && (
          <div
            className="t-tilt-glare pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 motion-reduce:hidden"
            style={{
              background:
                `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
              opacity: isTilting ? 1 : 0,
            }}
          />
        )}
      </div>
    </motion.div>
  );
}
