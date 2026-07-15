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
  FileText,
  Loader2,
  User,
  Wallet,
  X,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [description, setDescription] = useState("");
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
    setDisplayName("");
    setBio("");
    setDescription("");
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

  const handleCreate = useCallback(() => {
    if (!handle.trim()) return;
    const profileData = {
      handle: handle.trim(),
      displayName: displayName.trim() || handle.trim(),
      bio: bio.trim(),
      description: description.trim(),
    };
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("arcadia_profile_data", JSON.stringify(profileData));
      } catch {}
    }
    initializeProfile(handle.trim(), Math.min(Math.max(Number(maxLev) || 10, 1), 20));
  }, [handle, displayName, bio, description, maxLev, initializeProfile]);

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

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-void/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) dismissRoleGate(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select your Arcadia role"
        className="relative mx-4 w-full max-w-2xl rounded-2xl border border-line bg-panel shadow-xl"
      >
        <button
          type="button"
          onClick={dismissRoleGate}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex size-7 items-center justify-center rounded-full text-faint hover:bg-line hover:text-ink transition-colors"
        >
          <X className="size-3.5" />
        </button>

        <AnimatePresence mode="wait">
          {step === "select" ? (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-6 pt-7 pb-3">
                <p className="mb-1 font-mono text-[9px] tracking-[0.25em] text-faint uppercase">
                  Welcome to Arcadia
                </p>
                <h2 className="font-display text-xl font-bold tracking-[-0.03em] text-ink">
                  Select your role
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3 px-6 pb-6 sm:grid-cols-2">
                {ROLES.map((role, i) => (
                  <motion.button
                    key={role.id}
                    ref={i === 0 ? firstOptionRef : undefined}
                    type="button"
                    onClick={() => choose(role)}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      "group relative flex flex-col rounded-xl border p-5 text-left outline-none transition-all",
                      "hover:border-ink/30 focus-visible:ring-2 focus-visible:ring-acid focus-visible:ring-inset",
                      i === 0
                        ? "border-acid/20 bg-acid/[0.03]"
                        : "border-line bg-panel-2",
                    )}
                  >
                    <span
                      className={cn(
                        "mb-4 inline-flex items-center gap-1.5 self-start rounded border px-2 py-[2px]",
                        role.badgeClass,
                      )}
                    >
                      <span className={cn("size-[5px] rounded-full", role.dotClass)} />
                      <span className={cn("font-mono text-[8px] font-bold tracking-[0.2em] uppercase", role.hueClass)}>
                        {role.label}
                      </span>
                    </span>
                    <h3 className="mb-1.5 font-display text-2xl font-bold leading-none tracking-[-0.03em] text-ink">
                      {role.headline}
                    </h3>
                    <p className="mb-4 text-xs leading-relaxed text-muted">
                      {role.body}
                    </p>
                    <div className="mt-auto flex items-center gap-2 font-mono text-[10px] tracking-[0.02em] text-faint">
                      <span className="uppercase">{role.access}</span>
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="init"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="px-6 pb-6 pt-4"
            >
              <button
                type="button"
                onClick={() => { setStep("select"); resetTx(); }}
                className="mb-4 inline-flex items-center gap-1 text-xs text-faint hover:text-ink transition-colors"
              >
                <ArrowLeft className="size-3" />
                Back
              </button>

              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-acid/25 bg-acid/[0.05] px-3 py-1 font-mono text-[9px] font-bold tracking-[0.18em] text-acid uppercase">
                <span className="size-1.5 rounded-full bg-acid" />
                Initialize Trader Profile
              </div>

              {isSuccess ? (
                <div className="text-center py-4">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full border border-success/25 bg-success/10">
                    <CheckCircle className="size-5 text-success" />
                  </div>
                  <p className="text-base font-bold text-ink">Profile ready</p>
                  <p className="mt-1 text-sm text-muted">{txState.message}</p>
                  {txState.sig && (
                    <a
                      href={`https://solscan.io/tx/${txState.sig}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 font-mono text-[0.6rem] text-cyan hover:opacity-70 transition-opacity"
                    >
                      {txState.sig.slice(0, 8)}…{txState.sig.slice(-6)}
                      <ExternalLink size={9} />
                    </a>
                  )}
                  <p className="mt-3 text-xs text-faint">Entering terminal…</p>
                </div>
              ) : (
                <>
                  <p className="mb-4 text-sm text-muted">
                    Set up your on-chain trader identity. A small SOL fee is required.
                  </p>

                  <div className="mb-4 space-y-3">
                    <div>
                      <label htmlFor="init-display-name" className="mb-1 block text-xs text-faint">
                        <User className="mr-1 inline size-3" />
                        Display Name
                      </label>
                      <Input
                        id="init-display-name"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Nova Trader"
                        disabled={isPending}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="init-handle" className="mb-1 block text-xs text-faint">
                        Handle (on-chain ID)
                      </label>
                      <Input
                        id="init-handle"
                        ref={handleRef}
                        type="text"
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                        placeholder="your-handle"
                        disabled={isPending}
                        className="h-9 text-sm tabular-nums"
                      />
                    </div>
                    <div>
                      <label htmlFor="init-bio" className="mb-1 block text-xs text-faint">
                        <FileText className="mr-1 inline size-3" />
                        Bio
                      </label>
                      <Input
                        id="init-bio"
                        type="text"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Short trading style description"
                        disabled={isPending}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="init-description" className="mb-1 block text-xs text-faint">
                        Strategy Description
                      </label>
                      <Textarea
                        id="init-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your trading strategy, markets you trade, risk management approach..."
                        disabled={isPending}
                        className="min-h-[60px] text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="init-leverage" className="mb-1 block text-xs text-faint">
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
                      <div className="mt-1 flex justify-between font-mono text-[0.55rem] text-faint">
                        <span>1x</span>
                        <span>20x</span>
                      </div>
                    </div>
                  </div>

                  {!connected ? (
                    <div className="flex items-center gap-2 rounded-lg border border-line bg-panel-2 px-3.5 py-2.5 text-xs text-faint">
                      <Wallet className="size-3.5 shrink-0" />
                      Connect your wallet first
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={isPending || !handle.trim()}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-acid py-2.5 text-xs font-black tracking-wide text-void transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 motion-reduce:transform-none"
                    >
                      {isPending && <Loader2 className="size-4 animate-spin" />}
                      {isPending ? txState.message : "Create Profile on Solana"}
                    </button>
                  )}

                  {isPending && (
                    <div className="mt-2 flex items-center justify-center gap-2 text-xs text-faint">
                      <Clock className="size-3" />
                      {txState.message}
                    </div>
                  )}

                  {isError && (
                    <div className="mt-2 rounded-lg border border-danger/25 bg-danger/10 p-3 text-xs text-danger">
                      {txState.message}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
