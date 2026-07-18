"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { CheckCircle, Clock, ExternalLink, Loader2, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MicroLabel, Panel, StatTile } from "@/components/pages/trader/trader-ui";
import { apiFetch } from "@/lib/utils";
import { formatUSD, type TraderProfile } from "@/lib/types";
import { useArcadiaVault } from "@/lib/use-arcadia-vault";

/**
 * Manage Vault modal. Triggered from the topbar wallet menu so a trader can
 * self-fund and toggle investor deposits from any page. Mirrors the body that
 * used to live at /manage; the route now soft-redirects to /dashboard.
 */
export function ManageVaultModal({
  children,
}: {
  children?: React.ReactNode;
}) {
  const { connected, publicKey } = useWallet();
  const [open, setOpen] = useState(false);
  const [selfFundAmount, setSelfFundAmount] = useState("");
  // Local override lets the trader toggle the switch optimistically; we fall
  // back to the server value when there is no override yet (avoids driving
  // depositsOpen from an effect, which trips react-hooks/set-state-in-effect).
  const [depositsOverride, setDepositsOverride] = useState<boolean | null>(null);

  const { deposit, txState, resetTx } = useArcadiaVault();

  const { data: profile } = useQuery<TraderProfile>({
    queryKey: ["profile"],
    queryFn: () => apiFetch<TraderProfile>("/profile"),
    enabled: connected && open,
  });

  const score = profile?.score ?? 0;
  const capacity = score * 1000;
  const aum = profile?.aum ?? 0;
  const selfFunded = profile?.trader_self_funded ?? 0;
  const capacityLeft = capacity - aum;
  const depositsOpen = depositsOverride ?? profile?.deposits_open ?? true;

  const isPending = ["checking", "init-investor", "signing", "confirming"].includes(
    txState.phase,
  );
  const isSuccess = txState.phase === "success";
  const isError = txState.phase === "error";

  const handleSelfFund = async () => {
    const amount = parseFloat(selfFundAmount);
    if (!amount || amount <= 0) return;
    resetTx();
    const ok = await deposit(publicKey?.toBase58() ?? "", amount);
    if (ok) setSelfFundAmount("");
  };

  const trigger = children ?? (
    <Button variant="outline" size="sm" className="gap-1.5 font-bold">
      <Wallet size={12} />
      Manage Vault
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="border-b border-line px-5 py-4">
          <DialogTitle className="text-sm font-black tracking-tight text-ink">
            Manage Vault
          </DialogTitle>
          <DialogDescription className="text-[0.7rem] text-faint">
            Self-fund your vault and toggle investor deposits. Solana devnet simulation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 p-5">
          {/* Capacity formula */}
          <Panel
            className="flex flex-wrap items-center gap-4 rounded-lg border border-acid/20 bg-acid/[0.06] p-4"
          >
            <div className="font-mono text-2xl font-bold tabular-nums text-acid">{score}</div>
            <div className="text-lg font-bold text-faint">×</div>
            <div>
              <MicroLabel>Score × $1,000</MicroLabel>
              <p className="text-sm font-bold text-ink">
                {formatUSD(capacity, 0)} vault capacity
              </p>
            </div>
            {capacity > 0 && (
              <div className="ml-auto text-right">
                <MicroLabel>Utilized</MicroLabel>
                <p className="font-mono text-base font-bold tabular-nums text-acid">
                  {Math.round((aum / capacity) * 100)}%
                </p>
              </div>
            )}
          </Panel>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="AUM" value={formatUSD(aum, 0)} />
            <StatTile label="Capacity" value={formatUSD(capacity, 0)} />
            <StatTile label="Left" value={formatUSD(capacityLeft, 0)} />
            <StatTile label="Self-funded" value={formatUSD(selfFunded, 0)} />
          </div>

          {/* Self-fund */}
          <div className="rounded-lg border border-line bg-panel-2 p-4">
            <MicroLabel className="mb-2">Self-fund Vault</MicroLabel>
            <p className="mb-3 text-[0.7rem] leading-relaxed text-muted">
              Deposit your own USDC as a trader-own position. Signals skin-in-the-game to
              investors. Withdraws via the normal path.
            </p>

            <label htmlFor="self-fund-amount" className="mb-1 block text-[0.7rem] text-faint">
              Amount (USDC)
            </label>
            <Input
              id="self-fund-amount"
              type="number"
              value={selfFundAmount}
              onChange={(e) => setSelfFundAmount(e.target.value)}
              placeholder="0.00"
              disabled={isPending}
              className="mb-3 tabular-nums"
            />

            {capacityLeft <= 0 ? (
              <div className="w-full rounded-lg border border-white/10 bg-panel py-2 text-center text-xs font-semibold text-faint">
                Vault at capacity
              </div>
            ) : (
              <Button
                onClick={handleSelfFund}
                disabled={isPending || !selfFundAmount}
                size="lg"
                className="w-full"
              >
                {isPending && <Loader2 size={14} className="animate-spin" />}
                {isPending ? "Signing transaction…" : "Deposit (own)"}
              </Button>
            )}

            {isPending && (
              <div className="mt-2 flex items-center gap-2 text-[0.7rem] text-faint">
                <Clock size={12} />
                {txState.message}
              </div>
            )}

            {isSuccess && (
              <div className="mt-3 rounded-lg border border-success/25 bg-success/10 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <CheckCircle size={13} className="text-success" />
                  <span className="text-xs font-bold text-success">
                    {txState.simulated
                      ? "Self-fund simulated (vault not live on devnet)"
                      : "Self-fund confirmed"}
                  </span>
                </div>
                {txState.sig && (
                  <a
                    href={`https://solscan.io/tx/${txState.sig}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-mono text-[0.65rem] text-cyan transition-opacity hover:opacity-70"
                  >
                    <span>
                      {txState.sig.slice(0, 8)}…{txState.sig.slice(-6)}
                    </span>
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            )}

            {isError && (
              <div className="mt-3 rounded-lg border border-danger/25 bg-danger/10 p-3 text-xs text-danger">
                {txState.message}
              </div>
            )}
          </div>

          {/* Deposits toggle */}
          <div className="flex items-center justify-between rounded-lg border border-line bg-panel-2 p-4">
            <div>
              <p className="text-xs font-semibold text-ink">Accept Deposits</p>
              <p className="text-[0.65rem] text-faint">
                Open / close your vault to investors
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={depositsOpen}
              aria-label="Accept deposits"
              onClick={() => setDepositsOverride(!depositsOpen)}
              className={`relative h-6 w-12 shrink-0 rounded-full border border-white/10 transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-acid focus-visible:ring-offset-2 focus-visible:ring-offset-void ${depositsOpen ? "bg-acid" : "bg-panel"}`}
            >
              <span
                className={`absolute top-[2px] size-5 rounded-full transition-all duration-300 ${depositsOpen ? "bg-void" : "bg-white"}`}
                style={{ left: depositsOpen ? "calc(100% - 22px)" : "2px" }}
              />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}