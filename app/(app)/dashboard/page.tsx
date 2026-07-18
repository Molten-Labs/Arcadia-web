"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Bell, ChevronRight, ExternalLink, Shield, TrendingUp, Wallet } from "lucide-react";

import { CountUp } from "@/components/acid/CountUp";
import { ScoreDial } from "@/components/acid/ScoreDial";
import { EquityChart } from "@/components/EquityChart";
import { PnLHeatmap } from "@/components/PnLHeatmap";
import { ScoreHistoryChart } from "@/components/ScoreHistoryChart";
import { TierChip } from "@/components/pages/trader/TierChip";
import {
  EnvChip,
  MicroLabel,
  PageHeader,
  Panel,
  StatTile,
} from "@/components/pages/trader/trader-ui";
import { RiskRadar } from "@/components/pages/discovery/RiskRadar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_DAILY_PNL, MOCK_SCORE_HISTORY, MOCK_TRADERS } from "@/lib/mock-data";
import { formatUSD, type ScoreTier } from "@/lib/types";

/* ── Demo data (mirrors the values the merged pages used to show) ─── */

const DEMO = {
  handle: "nova",
  score: 912,
  tier: "Elite" as const,
  confidence: "high" as const,
  ci: { lo: 895, point: 912, hi: 928 },
  days_active: 127,
  trade_count: 847,
  capacity_usd: 912000,
  sub_scores: { consistency: 94, risk_adjusted: 91, drawdown: 88, volume: 82 },
};

const TIERS = [
  { tier: "Verified" as const, range: "600–699", profit: 20, capacity: "×$1k/pt" },
  { tier: "Established" as const, range: "700–799", profit: 25, capacity: "×$1k/pt" },
  { tier: "Advanced" as const, range: "800–899", profit: 30, capacity: "×$1k/pt" },
  { tier: "Elite" as const, range: "900+", profit: 35, capacity: "×$1k/pt" },
];

const SCORE_WEIGHTS = [
  { label: "Win consistency", weight: 30, value: 94, desc: "Win-rate stability across 90-day rolling windows" },
  { label: "Risk-adjusted return", weight: 30, value: 91, desc: "Sortino ratio normalized against peer cohort" },
  { label: "Drawdown control", weight: 25, value: 88, desc: "Max DD & recovery speed vs. cohort average" },
  { label: "Trade volume", weight: 15, value: 82, desc: "Trade count weighted by market diversity" },
];

const MILESTONES = [
  { score: 600, label: "Fundable" },
  { score: 700, label: "Established" },
  { score: 800, label: "Advanced" },
  { score: 900, label: "Elite" },
  { score: 950, label: "Top 1%" },
].map((m) => ({ ...m, reached: m.score <= 900 }));

const TIER_ACCENT: Record<ScoreTier, { text: string; dot: string; ring: string }> = {
  Verified: { text: "text-tier-verified", dot: "bg-tier-verified", ring: "border-tier-verified/40 bg-tier-verified/[0.07]" },
  Established: { text: "text-tier-established", dot: "bg-tier-established", ring: "border-tier-established/40 bg-tier-established/[0.07]" },
  Advanced: { text: "text-tier-advanced", dot: "bg-tier-advanced", ring: "border-tier-advanced/40 bg-tier-advanced/[0.07]" },
  Elite: { text: "text-tier-elite", dot: "bg-tier-elite", ring: "border-tier-elite/40 bg-tier-elite/[0.07]" },
};

const TRADER = MOCK_TRADERS[0];

/* ── Activity demo (lifted from old /dashboard) ────────────────────── */

const ACCOUNT = {
  name: "Eval #4821",
  status: "Active Funded",
  size: 25000,
  equity: 27311,
  cum_pnl: 2311,
  win_rate: 52,
  trades: 41,
  risk: "Medium",
};

function genEquity(days: number) {
  let eq = 9500;
  let hwm = 9500;
  let mdd = 0;
  const data = [];
  for (let i = 0; i < days; i++) {
    eq = eq + (Math.random() - 0.46) * 120;
    eq = Math.max(8500, eq);
    hwm = Math.max(hwm, eq);
    const dd = hwm > 0 ? ((hwm - eq) / hwm) * 100 : 0;
    mdd = Math.max(mdd, dd);
    const target = 9500 + i * 30;
    data.push({
      day: i + 1,
      equity: Math.round(eq),
      target: Math.round(target),
      daily_dd: -Math.round(dd * 10) / 10,
      max_dd: -Math.round(mdd * 10) / 10,
    });
  }
  return data;
}

function genPnl(days: number) {
  let v = 10000;
  return Array.from({ length: days }, (_, i) => {
    v += (Math.random() - 0.48) * 300;
    return { day: i + 1, pnl: Math.round(v) };
  });
}

// Stable mock series (computed once at module load so re-renders stay pure).
const EQUITY_DATA = genEquity(30);
const PNL_DATA = genPnl(30);

const POSITIONS = [
  { coin: "$LINK", dir: "Short", size: 15352, entry: "303.30 USD", mark: "23.19 USD", rpnl: "+$3.69", upnl: "-$93.69", opened: "2h 14m" },
  { coin: "$TRON", dir: "Long", size: 15352, entry: "443.50 USD", mark: "4.28 USD", rpnl: "+$2.45", upnl: "+$22.45", opened: "2h 14m" },
  { coin: "$HYPE", dir: "Short", size: 18352, entry: "502.00 USD", mark: "58.99 USD", rpnl: "-$1.69", upnl: "-$13.69", opened: "2h 14m" },
];

const STREAK = ["L", "L", "W", "W", "W", "L", "W", "W", "W", "L", "L"];

const CHART_TOOLTIP = {
  contentStyle: {
    background: "var(--color-panel-2)",
    border: "1px solid var(--color-line)",
    borderRadius: 8,
    fontSize: 12,
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
  },
  itemStyle: { color: "var(--color-acid)" },
  labelStyle: { color: "var(--color-muted)", marginBottom: 4 },
} as const;

const AXIS_TICK = { fontSize: 10, fill: "var(--color-faint)", fontFamily: "var(--font-mono)" } as const;

function pnlTone(n: number) {
  if (n > 0) return "text-success";
  if (n < 0) return "text-danger";
  return "text-muted";
}

/* ── Sub-components ───────────────────────────────────────────────── */

function StatBar({ label, value, pctWidth, color, foot }: {
  label: string;
  value: string;
  pctWidth: string;
  color: string;
  foot: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <MicroLabel className="mb-1.5">{label}</MicroLabel>
      <p className="mb-1.5 text-sm font-black text-ink tabular-nums">{value}</p>
      <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-line">
        <div className="acid-bar h-full rounded-full" style={{ width: pctWidth, background: color }} />
      </div>
      <div className="flex justify-between text-[0.625rem] font-medium text-faint">{foot}</div>
    </div>
  );
}

function PositionsTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Position</TableHead>
          <TableHead className="text-right">Net Size</TableHead>
          <TableHead className="text-right">Entry Price</TableHead>
          <TableHead className="text-right">Mark Price</TableHead>
          <TableHead className="text-right">Realized PnL</TableHead>
          <TableHead className="text-right">Unrealized PnL</TableHead>
          <TableHead className="text-right">Time Opened</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {POSITIONS.map((p) => {
          const isShort = p.dir === "Short";
          return (
            <TableRow key={p.coin} className="group">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg border border-line bg-panel-2 font-black text-ink">
                    {p.coin.replace("$", "")[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold tracking-tight text-ink">{p.coin}</p>
                    <p className={`text-[0.625rem] font-bold uppercase ${isShort ? "text-danger" : "text-success"}`}>
                      {p.dir}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right font-bold tabular-nums">{p.size.toLocaleString()}</TableCell>
              <TableCell className="text-right tabular-nums text-muted transition-colors group-hover:text-ink motion-reduce:transition-none">{p.entry}</TableCell>
              <TableCell className="text-right tabular-nums text-ink">{p.mark}</TableCell>
              <TableCell className={`text-right font-bold tabular-nums ${p.rpnl.startsWith("-") ? "text-danger" : "text-success"}`}>
                {p.rpnl}
              </TableCell>
              <TableCell className={`text-right font-black tabular-nums ${p.upnl.startsWith("-") ? "text-danger" : "text-success"}`}>
                {p.upnl}
              </TableCell>
              <TableCell className="text-right tabular-nums text-faint">{p.opened}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/* ── Reputation tab ──────────────────────────────────────────────── */

function ReputationTab() {
  return (
    <div className="space-y-6">
      {/* Score hero */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Panel
          className="group acid-int flex flex-col items-center justify-center gap-3 p-6"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(204,255,0,0.08) 0%, transparent 70%)",
          }}
        >
          <ScoreDial value={DEMO.score} tier="elite" size={140} />
          <div className="flex flex-wrap items-center justify-center gap-2">
            <TierChip tier={DEMO.tier} />
            <span className="rounded-full border border-success/25 bg-success/10 px-2 py-0.5 font-mono text-[0.6rem] tracking-wider text-success uppercase">
              {DEMO.confidence} confidence
            </span>
          </div>
          <p className="font-mono text-[0.7rem] tabular-nums text-faint">
            95% CI: [{DEMO.ci.lo} – {DEMO.ci.hi}]
          </p>
        </Panel>

        <div className="grid grid-cols-2 gap-3 md:col-span-2">
          <StatTile label="Arcadia Score" value={<CountUp value={DEMO.score} />} accent />
          <StatTile
            label="Vault Capacity"
            value={<CountUp value={DEMO.capacity_usd / 1000} prefix="$" suffix="k" />}
            sub={`${DEMO.score} × $1,000`}
          />
          <StatTile label="Total Trades" value={<CountUp value={DEMO.trade_count} />} />
          <StatTile label="Profit Share" value="35%" sub="Elite tier" accent />
        </div>
      </div>

      {/* Milestone strip */}
      <Panel className="group acid-int flex items-center gap-1 overflow-x-auto p-4">
        {MILESTONES.map((m, i) => (
          <div key={m.score} className="flex shrink-0 items-center gap-1">
            <div
              className={`flex flex-col items-center gap-1 rounded-lg border px-4 py-2 ${
                m.reached ? "border-acid/25 bg-acid/[0.06]" : "border-white/10 bg-panel-2"
              }`}
            >
              <span
                className={`font-mono text-[0.65rem] font-black tabular-nums ${
                  m.reached ? "text-acid" : "text-faint"
                }`}
              >
                {m.score}
              </span>
              <span
                className={`text-[0.55rem] font-bold tracking-wider uppercase ${
                  m.reached ? "text-ink" : "text-faint"
                }`}
              >
                {m.label}
              </span>
              {m.reached && <span className="text-[0.5rem] text-success">✓ Reached</span>}
            </div>
            {i < MILESTONES.length - 1 && (
              <div
                className={`h-px w-6 shrink-0 ${
                  m.reached && MILESTONES[i + 1].reached ? "bg-acid" : "bg-white/10"
                }`}
              />
            )}
          </div>
        ))}
      </Panel>

      {/* Score breakdown + tiers */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Panel className="group acid-int p-5">
          <MicroLabel className="mb-4">Score Breakdown</MicroLabel>
          <div className="space-y-4">
            {SCORE_WEIGHTS.map((s) => {
              const pts = Math.round((s.value / 100) * s.weight * 10);
              return (
                <div key={s.label}>
                  <div className="mb-1 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-ink">{s.label}</span>
                      <span className="ml-2 text-[0.6rem] text-faint">{s.weight}% weight</span>
                    </div>
                    <span className="font-mono text-xs font-black tabular-nums text-acid">{pts} pts</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-panel-2">
                    <div
                      className="acid-bar h-full rounded-full bg-gradient-to-r from-acid to-cyan"
                      style={{ width: `${s.value}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[0.6rem] text-faint">{s.desc}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-xs font-medium text-faint">Total Score</span>
            <span className="font-mono text-xl font-black tabular-nums text-acid">{DEMO.score}</span>
          </div>
        </Panel>

        <Panel className="group acid-int p-5">
          <MicroLabel className="mb-4">Tier Progression</MicroLabel>
          <div className="space-y-2">
            {TIERS.map((t) => {
              const active = DEMO.tier === t.tier;
              const accent = TIER_ACCENT[t.tier];
              return (
                <div
                  key={t.tier}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-300 ease-[cubic-bezier(0.19,1,0.22,1)] motion-reduce:transition-none ${
                    active ? accent.ring : "border-transparent bg-panel-2 hover:border-white/15"
                  }`}
                >
                  {active && <div className={`size-1.5 shrink-0 rounded-full ${accent.dot}`} />}
                  <TierChip tier={t.tier} size="sm" />
                  <span className="flex-1 font-mono text-xs tabular-nums text-faint">{t.range}</span>
                  <div className="text-right">
                    <div className={`font-mono text-xs font-semibold tabular-nums ${active ? accent.text : "text-muted"}`}>
                      {t.profit}% share
                    </div>
                    <div className="text-[0.6rem] text-faint">Cap {t.capacity}</div>
                  </div>
                  {active && <ChevronRight size={12} className={accent.text} />}
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-[0.6rem] leading-relaxed text-faint">
            All traders are fundable. Vault capacity = score × $1,000 USD. Computed by
            the Arcadia indexer from on-chain TradeClosed events.
          </p>
        </Panel>
      </div>

      {/* Score history + heatmap */}
      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Score History</TabsTrigger>
          <TabsTrigger value="heatmap">P&amp;L Heatmap</TabsTrigger>
        </TabsList>
        <TabsContent value="history">
          <Panel className="group acid-int p-5">
            <div className="mb-5 flex items-center gap-2">
              <TrendingUp size={14} className="text-acid" />
              <MicroLabel>Score History — 180 days</MicroLabel>
            </div>
            <ScoreHistoryChart data={MOCK_SCORE_HISTORY["nova"] ?? []} height={280} />
            <p className="mt-3 text-[0.6rem] leading-relaxed text-faint">
              Score is recomputed after every trade settlement. Tier bands shown as shaded regions.
            </p>
          </Panel>
        </TabsContent>
        <TabsContent value="heatmap">
          <Panel className="group acid-int p-5">
            <MicroLabel className="mb-5">Daily P&amp;L Heatmap</MicroLabel>
            <PnLHeatmap data={MOCK_DAILY_PNL["nova"] ?? []} />
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Performance tab ─────────────────────────────────────────────── */

function PerformanceTab() {
  return (
    <div className="space-y-6">
      {/* Headline metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Sharpe" value={TRADER.metrics.sharpe.toFixed(2)} />
        <StatTile label="Sortino" value={TRADER.metrics.sortino.toFixed(2)} />
        <StatTile label="Win Rate" value={`${TRADER.metrics.win_rate.toFixed(1)}%`} />
        <StatTile label="Avg Duration" value={`${TRADER.metrics.avg_trade_duration_hours.toFixed(1)}h`} />
      </div>

      {/* Equity + risk */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel className="group acid-int p-5 lg:col-span-2">
          <MicroLabel className="mb-4">Equity Curve — 90 days</MicroLabel>
          <EquityChart data={TRADER.equity_curve} height={200} />
        </Panel>

        <Panel className="group acid-int p-5">
          <MicroLabel className="mb-2">Risk Metrics</MicroLabel>
          <RiskRadar
            items={[
              { label: "Sortino", value: TRADER.metrics.sortino, max: 5, display: TRADER.metrics.sortino.toFixed(2) },
              { label: "Sharpe", value: TRADER.metrics.sharpe, max: 4, display: TRADER.metrics.sharpe.toFixed(2) },
              { label: "Win Rate", value: TRADER.metrics.win_rate, max: 100, display: `${TRADER.metrics.win_rate.toFixed(1)}%` },
              { label: "Volatility", value: TRADER.metrics.vol_30d, max: 30, display: `${TRADER.metrics.vol_30d.toFixed(1)}%`, tone: "muted" },
              { label: "Max DD", value: Math.abs(TRADER.metrics.max_dd), max: 30, display: `-${Math.abs(TRADER.metrics.max_dd).toFixed(1)}%`, invert: true },
            ]}
          />
          <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-xs">
            {(
              [
                ["7d Return", TRADER.metrics.return_7d],
                ["30d Return", TRADER.metrics.return_30d],
                ["90d Return", TRADER.metrics.return_90d],
                ["All-time", TRADER.metrics.return_all],
              ] as const
            ).map(([label, val]) => (
              <div key={label} className="flex justify-between">
                <span className="text-faint">{label}</span>
                <span className={`font-mono font-medium tabular-nums ${pnlTone(val)}`}>
                  {val > 0 ? "▲" : val < 0 ? "▼" : "–"} {Math.abs(val).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Trade history */}
      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/10 bg-panel-2 px-4 py-3">
          <MicroLabel>Trade History</MicroLabel>
          <span className="rounded border border-white/10 bg-panel px-2 py-1 font-mono text-[0.6rem] text-faint">
            {TRADER.trades.length} trades
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {["Market", "Side", "Size", "Lev", "Entry", "Exit", "PnL", "Closed", "On-chain"].map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {TRADER.trades.map((t) => (
              <TableRow key={t.id} className="group">
                <TableCell className="font-bold text-ink">{t.market}</TableCell>
                <TableCell
                  className={`text-[0.65rem] font-black tracking-wider uppercase ${
                    t.direction === "long" ? "text-success" : "text-danger"
                  }`}
                >
                  {t.direction}
                </TableCell>
                <TableCell className="tabular-nums">{formatUSD(t.size_usd, 0)}</TableCell>
                <TableCell className="tabular-nums">{t.leverage}x</TableCell>
                <TableCell className="tabular-nums text-muted transition-colors group-hover:text-ink motion-reduce:transition-none">
                  {t.entry_px < 10 ? t.entry_px.toFixed(4) : t.entry_px.toFixed(2)}
                </TableCell>
                <TableCell className="tabular-nums text-muted transition-colors group-hover:text-ink motion-reduce:transition-none">
                  {t.exit_px < 10 ? t.exit_px.toFixed(4) : t.exit_px.toFixed(2)}
                </TableCell>
                <TableCell className={`font-bold tabular-nums ${pnlTone(t.realized_pnl)}`}>
                  {t.realized_pnl >= 0 ? "+" : ""}
                  {formatUSD(t.realized_pnl, 0)}
                </TableCell>
                <TableCell className="tabular-nums text-faint">
                  {new Date(t.closed_at * 1000).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {t.sig ? (
                    <a
                      href={`https://solscan.io/tx/${t.sig}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-mono text-[0.6rem] text-cyan transition-opacity hover:opacity-70"
                      title={t.sig}
                    >
                      <span>{t.sig.slice(0, 6)}…</span>
                      <ExternalLink size={10} />
                    </a>
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </div>
  );
}

/* ── Activity tab ────────────────────────────────────────────────── */

function ActivityTab() {
  return (
    <div className="space-y-6">
      {/* Account row */}
      <Panel className="flex flex-wrap items-center gap-8 border-l-2 border-l-acid p-5">
        <div className="min-w-[140px]">
          <MicroLabel className="mb-1">Account</MicroLabel>
          <p className="text-lg font-black tracking-tight text-ink">{ACCOUNT.name}</p>
          <p className="mt-0.5 text-[0.6875rem] font-medium text-muted">{ACCOUNT.status}</p>
        </div>
        {(
          [
            ["Size", `$${(ACCOUNT.size / 1000).toFixed(0)}k`, "text-ink"],
            ["Equity", `$${ACCOUNT.equity.toLocaleString()}`, "text-ink"],
            ["Cum. PnL", `+$${ACCOUNT.cum_pnl.toLocaleString()}`, "text-success"],
            ["Win Rate", `${ACCOUNT.win_rate}%`, "text-ink"],
            ["Trades", `${ACCOUNT.trades}`, "text-ink"],
            ["Risk", ACCOUNT.risk, "text-ink"],
          ] as const
        ).map(([label, value, color]) => (
          <div key={label} className="flex flex-col border-l border-line pl-8 first:border-0 first:pl-0">
            <MicroLabel className="mb-1">{label}</MicroLabel>
            <span className={`font-mono text-lg font-black tracking-tight tabular-nums ${color}`}>{value}</span>
          </div>
        ))}
        <div className="ml-auto">
          <span className="flex items-center gap-1.5 rounded-md border border-success/30 bg-success/12 px-3 py-1.5 text-[0.6875rem] font-bold text-success">
            <span className="size-1.5 rounded-full bg-success motion-safe:animate-pulse" /> Active
          </span>
        </div>
      </Panel>

      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {/* Chart card */}
          <Panel className="overflow-hidden">
            <Tabs defaultValue="equity" className="gap-0">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-panel-2 px-5 py-3">
                <TabsList>
                  <TabsTrigger value="equity">Account Equity</TabsTrigger>
                  <TabsTrigger value="pnl">PnL</TabsTrigger>
                </TabsList>
                <div className="flex gap-1.5" aria-hidden>
                  {["1D", "7D", "30D", "ALL"].map((p) => (
                    <span
                      key={p}
                      className={`rounded-md border px-2.5 py-1 font-mono text-[0.625rem] font-bold ${
                        p === "30D" ? "border-acid/30 bg-acid/10 text-acid" : "border-transparent text-muted"
                      }`}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <TabsContent value="equity" className="p-6">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={EQUITY_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="eqAcid" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-acid)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-acid)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
                    <XAxis dataKey="day" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <Tooltip {...CHART_TOOLTIP} />
                    <Area type="monotone" dataKey="equity" stroke="var(--color-acid)" strokeWidth={2} fill="url(#eqAcid)" name="Equity" activeDot={{ r: 4, fill: "var(--color-acid)", stroke: "var(--color-void)", strokeWidth: 2 }} />
                    <Line type="monotone" dataKey="target" stroke="var(--color-cyan)" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Profit Target" />
                    <Line type="monotone" dataKey="daily_dd" stroke="var(--color-tier-advanced)" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Daily DD" />
                    <Line type="monotone" dataKey="max_dd" stroke="var(--color-danger)" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Max DD" />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="mt-4 flex flex-wrap justify-center gap-5">
                  {(
                    [
                      ["var(--color-acid)", "Equity"],
                      ["var(--color-cyan)", "Profit Target"],
                      ["var(--color-tier-advanced)", "Daily Drawdown"],
                      ["var(--color-danger)", "Max Drawdown"],
                    ] as const
                  ).map(([color, label]) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="h-0.5 w-5 shrink-0" style={{ background: color }} />
                      <MicroLabel>{label}</MicroLabel>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="pnl" className="p-6">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={PNL_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
                    <XAxis dataKey="day" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <Tooltip {...CHART_TOOLTIP} />
                    <ReferenceLine y={10000} stroke="var(--color-line)" strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="pnl" stroke="var(--color-acid)" strokeWidth={2} dot={false} name="PnL" activeDot={{ r: 4, fill: "var(--color-acid)", stroke: "var(--color-void)", strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </Panel>

          {/* Positions */}
          <Panel className="flex-1 overflow-hidden">
            <Tabs defaultValue="open" className="gap-0">
              <div className="flex items-center gap-4 border-b border-line bg-panel-2 px-5 py-3">
                <TabsList>
                  <TabsTrigger value="open">Open Positions</TabsTrigger>
                  <TabsTrigger value="history">Historical Trades</TabsTrigger>
                </TabsList>
                <div className="ml-auto">
                  <select
                    aria-label="Filter by asset"
                    className="cursor-pointer rounded-md border border-line bg-panel px-3 py-1.5 font-mono text-[0.625rem] font-bold tracking-widest text-ink uppercase outline-none"
                  >
                    <option>All Assets</option>
                  </select>
                </div>
              </div>
              <TabsContent value="open"><PositionsTable /></TabsContent>
              <TabsContent value="history"><PositionsTable /></TabsContent>
            </Tabs>
          </Panel>
        </div>

        {/* Right rail */}
        <div className="flex w-full flex-col gap-4 xl:w-64 xl:shrink-0">
          <Panel className="group acid-int p-5">
            <div className="mb-4 flex items-center justify-between">
              <MicroLabel>Risk &amp; Rules</MicroLabel>
              <span className="font-mono text-[0.5625rem] font-medium text-faint">Reset 21:42:08</span>
            </div>
            <StatBar
              label="Daily Drawdown"
              value="20%"
              pctWidth="35%"
              color="linear-gradient(90deg, var(--color-acid), var(--color-cyan))"
              foot={
                <>
                  <span>-$200.00 today</span>
                  <span className="text-muted">$800.00 left</span>
                </>
              }
            />
            <StatBar
              label="Max Drawdown"
              value="2%"
              pctWidth="8%"
              color="var(--color-danger)"
              foot={
                <>
                  <span>$0.0 total</span>
                  <span className="text-muted">$3,000 left</span>
                </>
              }
            />
            <div className="rounded-lg border border-line bg-void p-3.5">
              <MicroLabel className="mb-1">Withdrawn</MicroLabel>
              <p className="text-lg font-black tracking-tight text-success tabular-nums">+$12,480</p>
              <p className="mt-1 flex items-center justify-between text-[0.5625rem] font-medium text-faint">
                Lifetime
                <span className="flex items-center gap-1 text-success">
                  <span className="size-1.5 rounded-full bg-success" /> Paid out
                </span>
              </p>
            </div>
          </Panel>

          <Panel className="group acid-int p-5">
            <div className="mb-4 flex items-center justify-between">
              <MicroLabel>Statistics</MicroLabel>
              <div className="flex gap-1">
                <button type="button" aria-label="Previous period" className="flex size-6 items-center justify-center rounded border border-line text-faint hover:bg-panel-2">
                  <ChevronRight className="size-3 rotate-180" />
                </button>
                <button type="button" aria-label="Next period" className="flex size-6 items-center justify-center rounded border border-line text-faint hover:bg-panel-2">
                  <ChevronRight className="size-3" />
                </button>
              </div>
            </div>
            <div className="space-y-3 text-xs">
              {(
                [
                  ["Avg Win", "+$131.00", "text-success"],
                  ["Avg Loss", "-$180.00", "text-danger"],
                  ["Profit Factor", "2.09", "text-ink"],
                  ["Expectancy", "+$65.00", "text-success"],
                  ["Avg Hold", "69m", "text-ink"],
                  ["Best Day", "-$419.00", "text-danger"],
                  ["Worst Day", "-$706.00", "text-danger"],
                  ["Risk / Reward", "1:0.73", "text-ink"],
                ] as const
              ).map(([k, v, c]) => (
                <div key={k} className="flex items-center justify-between border-b border-line pb-2 last:border-0 last:pb-0">
                  <span className="font-medium text-faint">{k}</span>
                  <span className={`font-bold tabular-nums ${c}`}>{v}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="group acid-int p-5">
            <div className="mb-4 flex items-center justify-between">
              <MicroLabel>Streak</MicroLabel>
              <span className="rounded bg-danger/12 px-2 py-0.5 text-xs font-black text-danger">2L</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STREAK.map((s, i) => (
                <div
                  key={i}
                  className={`flex size-7 items-center justify-center rounded border text-[0.6875rem] font-bold ${
                    s === "W" ? "border-success/30 bg-success/12 text-success" : "border-danger/30 bg-danger/12 text-danger"
                  }`}
                >
                  {s}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { connected } = useWallet();

  if (!connected) {
    return (
      <div className="grid min-h-[70vh] place-items-center bg-void px-5">
        <Panel className="max-w-sm p-10 text-center">
          <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full border border-acid/25 bg-acid/10">
            <Wallet size={24} className="text-acid" />
          </div>
          <p className="mb-2 text-base font-semibold text-ink">Connect wallet</p>
          <p className="text-sm text-faint">
            Connect Phantom or Solflare to view your score, performance, and activity.
          </p>
        </Panel>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-void">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <PageHeader title="Dashboard" icon={<Shield size={18} />}>
          <EnvChip>
            <Bell size={11} className="text-acid" />
            @{DEMO.handle} — devnet simulation
          </EnvChip>
        </PageHeader>

        <Tabs defaultValue="reputation">
          <TabsList>
            <TabsTrigger value="reputation">Reputation</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="reputation">
            <ReputationTab />
          </TabsContent>
          <TabsContent value="performance">
            <PerformanceTab />
          </TabsContent>
          <TabsContent value="activity">
            <ActivityTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}