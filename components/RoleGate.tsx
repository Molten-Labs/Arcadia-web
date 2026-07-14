"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  ExternalLink,
  Loader2,
  Wallet,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { TiltCard } from "@/components/ui/tilt-card";
import { useRole } from "@/lib/role-context";
import { useArcadiaVault } from "@/lib/use-arcadia-vault";
import { cn } from "@/lib/utils";

type RoleId = "trader" | "investor";

interface RoleOption {
  id: RoleId;
  label: string;
  headline: string;
  body: string;
  access: string;
  route: string;
  dotClass: string;
  hueClass: string;
  badgeClass: string;
}

const ROLES: RoleOption[] = [
  {
    id: "trader",
    label: "Trader",
    headline: "I trade.",
    body: "Build an on-chain reputation, open a vault to investors, and earn a profit split based on your Arcadia Score.",
    access: "Terminal / Analytics / Payouts / Vault",
    route: "/terminal",
    dotClass: "bg-acid",
    hueClass: "text-acid",
    badgeClass: "border-acid/25 bg-acid/[0.06]",
  },
  {
    id: "investor",
    label: "Investor",
    headline: "I allocate.",
    body: "Browse verified traders, deposit into vaults, and monitor your portfolio NAV and returns across the marketplace.",
    access: "Marketplace / Portfolio / Returns / History",
    route: "/dashboard",
    dotClass: "bg-cyan",
    hueClass: "text-cyan",
    badgeClass: "border-cyan/25 bg-cyan/[0.06]",
  },
];

const PENDING_PHASES = ["checking", "init-investor", "signing", "confirming"];

export function RoleGate() {
  const { publicKey, connected } = useWallet();
  const { showRoleGate, setRole, dismissRoleGate } = useRole();
  const { initializeProfile, txState, resetTx } = useArcadiaVault();
  const router = useRouter();
  const firstOptionRef = useRef<HTMLButtonElement>(null);
  const handleRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"select" | "init">("select");
  const [handle, setHandle] = useState("");
  const [maxLev, setMaxLev] = useState("10");

  const isPending = PENDING_PHASES.includes(txState.phase);
  const isSuccess = txState.phase === "success";
  const isError = txState.phase === "error";

  useEffect(() => {
    if (!showRoleGate) return;
    setStep("select");
    resetTx();
    if (!publicKey) return;
    setHandle(publicKey.toBase58().slice(0, 8));
  }, [showRoleGate, publicKey, resetTx]);

  useEffect(() => {
    if (!showRoleGate) return;
    if (step === "select") firstOptionRef.current?.focus();
    else handleRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (step === "init") setStep("select");
        else dismissRoleGate();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showRoleGate, step, dismissRoleGate]);

  useEffect(() => {
    if (isSuccess) {
      const t = setTimeout(() => router.push("/terminal"), 1200);
      return () => clearTimeout(t);
    }
  }, [isSuccess, router]);

  if (!showRoleGate) return null;

  function choose(role: RoleOption) {
    setRole(role.id);
    if (role.id === "trader") {
      setStep("init");
    } else {
      router.push(role.route);
    }
  }

  const handleCreate = useCallback(() => {
    if (!handle.trim()) return;
    initializeProfile(handle.trim(), Math.min(Math.max(Number(maxLev) || 10, 1), 20));
  }, [handle, maxLev, initializeProfile]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Select your Arcadia role"
      className="fixed inset-0 z-[200] flex flex-col bg-void"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-line px-6 py-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex size-[26px] items-center justify-center rounded-[7px] bg-acid">
            <span className="font-mono text-[7px] font-bold tracking-[0.05em] text-void">ARC</span>
          </div>
          <span className="font-mono text-[0.8125rem] font-bold tracking-tight text-ink">Arcadia</span>
        </div>
        <span className="font-mono text-[9px] tracking-[0.22em] text-faint uppercase">
          New session
        </span>
      </div>

      <AnimatePresence mode="wait">
        {step === "select" ? (
          <motion.div
            key="select"
            className="flex flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
          >
            {/* Role prompt */}
            <div className="flex max-w-3xl flex-col items-start px-6 pt-12 pb-6 sm:px-8">
              <p className="mb-3.5 font-mono text-[9px] tracking-[0.25em] text-faint uppercase">
                How are you using Arcadia?
              </p>
              <h1 className="m-0 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
                Select your role to continue.
              </h1>
            </div>

            {/* Two-panel split */}
            <div className="grid flex-1 grid-cols-1 overflow-hidden border-t border-line md:grid-cols-2">
              {ROLES.map((role, i) => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "flex",
                    i === 0 && "border-b border-line md:border-r md:border-b-0",
                  )}
                >
                  <TiltCard className="w-full" maxTilt={6} scale={1.015} speed={300}>
                    <button
                      ref={i === 0 ? firstOptionRef : undefined}
                      type="button"
                      onClick={() => choose(role)}
                      className={cn(
                        "group flex w-full flex-col justify-between p-8 text-left outline-none transition-colors sm:p-10",
                        "focus-visible:ring-2 focus-visible:ring-acid focus-visible:ring-inset focus-visible:rounded-[inherit]",
                        "h-full",
                      )}
                    >
                      <div>
                        <span
                          className={cn(
                            "mb-8 inline-flex items-center gap-2 rounded border px-2.5 py-[3px]",
                            role.badgeClass,
                          )}
                        >
                          <span className={cn("size-[5px] rounded-full", role.dotClass)} />
                          <span className={cn("font-mono text-[8px] font-bold tracking-[0.2em] uppercase", role.hueClass)}>
                            {role.label}
                          </span>
                        </span>
                        <h2 className="m-0 mb-5 font-display text-[clamp(2rem,4vw,3.5rem)] font-bold leading-none tracking-[-0.04em] text-ink">
                          {role.headline}
                        </h2>
                        <p className="m-0 max-w-[36ch] text-[0.9375rem] leading-relaxed text-muted">
                          {role.body}
                        </p>
                      </div>
                      <div className="mt-12 flex items-center justify-between border-t border-line pt-8">
                        <div>
                          <p className="mb-1 font-mono text-[8px] tracking-[0.2em] text-faint uppercase">Access</p>
                          <p className="font-mono text-[0.6875rem] text-muted">{role.access}</p>
                        </div>
                        <div
                          className={cn(
                            "flex items-center gap-2 font-mono text-xs font-bold tracking-[0.02em]",
                            role.hueClass,
                          )}
                        >
                          Continue
                          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </button>
                  </TiltCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="init"
            className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={() => { setStep("select"); resetTx(); }}
              className="mb-6 inline-flex items-center gap-1.5 text-xs text-faint hover:text-ink transition-colors self-start"
            >
              <ArrowLeft className="size-3.5" />
              Back to role selection
            </button>

            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-acid/25 bg-acid/[0.05] px-3.5 py-1.5 font-mono text-[0.64rem] font-bold tracking-[0.18em] text-acid uppercase self-start">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-acid" />
              Initialize Trader Profile
            </div>

            {isSuccess ? (
              <div className="text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full border border-success/25 bg-success/10">
                  <CheckCircle className="size-7 text-success" />
                </div>
                <p className="text-lg font-bold text-ink">Profile ready</p>
                <p className="mt-1 text-sm text-muted">{txState.message}</p>
                {txState.sig && (
                  <a
                    href={`https://solscan.io/tx/${txState.sig}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 font-mono text-[0.65rem] text-cyan hover:opacity-70 transition-opacity"
                  >
                    {txState.sig.slice(0, 8)}…{txState.sig.slice(-6)}
                    <ExternalLink size={10} />
                  </a>
                )}
                <p className="mt-4 text-xs text-faint">Entering terminal…</p>
              </div>
            ) : (
              <>
                <h2 className="mb-1 font-display text-[clamp(1.5rem,3vw,2rem)] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
                  Create your profile
                </h2>
                <p className="mb-8 text-sm text-muted">
                  Set up your on-chain trader identity. A small SOL fee is required for initialization.
                </p>

                <div className="mb-6 space-y-4">
                  <div>
                    <label htmlFor="init-handle" className="mb-1.5 block text-xs text-faint">
                      Handle
                    </label>
                    <Input
                      id="init-handle"
                      ref={handleRef}
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="your handle"
                      disabled={isPending}
                      className="tabular-nums"
                    />
                  </div>
                  <div>
                    <label htmlFor="init-leverage" className="mb-1.5 block text-xs text-faint">
                      Max leverage ({maxLev}x)
                    </label>
                    <Input
                      id="init-leverage"
                      type="range"
                      min="1"
                      max="20"
                      value={maxLev}
                      onChange={(e) => setMaxLev(e.target.value)}
                      disabled={isPending}
                      className="h-2 cursor-pointer accent-acid"
                    />
                    <div className="mt-1 flex justify-between font-mono text-[0.6rem] text-faint">
                      <span>1x</span>
                      <span>20x</span>
                    </div>
                  </div>
                </div>

                {!connected ? (
                  <div className="flex items-center gap-2 rounded-lg border border-line bg-panel-2 px-4 py-3 text-xs text-faint">
                    <Wallet className="size-3.5 shrink-0" />
                    Connect your wallet first
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={isPending || !handle.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-acid py-3 text-xs font-black tracking-wide text-void transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 motion-reduce:transform-none"
                  >
                    {isPending && <Loader2 className="size-4 animate-spin" />}
                    {isPending ? txState.message : "Create Profile (SOL fee)"}
                  </button>
                )}

                {isPending && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-xs text-faint">
                    <Clock className="size-3" />
                    {txState.message}
                  </div>
                )}

                {isError && (
                  <div className="mt-3 rounded-lg border border-danger/25 bg-danger/10 p-3 text-xs text-danger">
                    {txState.message}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-line px-6 py-3.5 sm:px-8">
        <span className="font-mono text-[9px] tracking-[0.1em] text-faint">
          Role can be changed anytime from Settings
        </span>
        <span className="font-mono text-[9px] tracking-[0.1em] text-faint">Solana Devnet</span>
      </div>
    </div>
  );
}
