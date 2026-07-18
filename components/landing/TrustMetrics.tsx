import { CountUp } from "@/components/acid/CountUp";
import { Reveal } from "@/components/acid";
import { Container } from "./bits";

/**
 * Protocol-wide aggregate counters shown directly under the hero. Mirrors the
 * pattern Drift ($826B deposits / $50B volume / 19.2M trades) and Hypernova
 * (1,602 waitlist / $904k reserve / $258k payouts) use to reshape the first
 * impression from "concept" to "live protocol".
 *
 * Numbers are mocked at protocol-aggregate scale but stay consistent with the
 * mock trader cards and the /traders leaderboard (top-N sums imply a larger
 * tail). The "Live · simulated" chip is honest about the devnet state and
 * matches the terminal's existing "Paper trading / Phoenix LIVE" voice.
 */
const METRICS = [
  {
    label: "Traders tracked",
    value: 0,
    suffix: "",
    caption: "verified on-chain",
  },
  {
    label: "Total vault AUM",
    value: 0,
    decimals: 2,
    prefix: "$",
    suffix: "M",
    caption: "across open vaults",
  },
  {
    label: "Average score",
    value: 0,
    suffix: "",
    caption: "rolling 90-day",
  },
  {
    label: "Payouts to traders",
    value: 0,
    decimals: 2,
    prefix: "$",
    suffix: "M",
    caption: "performance share",
  },
] as const;

export function TrustMetrics() {
  return (
    <section
      aria-label="Protocol metrics"
      className="relative border-b border-white/10 bg-onyx"
    >
      <Container className="max-w-[1180px]">
        <Reveal>
          <div className="flex flex-col gap-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            {/* Left: counters */}
            <div className="grid w-full grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4 sm:gap-x-0">
              {METRICS.map((m, i) => (
                <div
                  key={m.label}
                  className={`flex flex-col gap-1 ${i > 0 ? "sm:border-l sm:border-white/10 sm:pl-6" : ""}`}
                >
                  <span className="font-mono text-[0.62rem] tracking-[0.18em] text-faint uppercase">
                    {m.label}
                  </span>
                  <CountUp
                    value={m.value}
                    decimals={"decimals" in m ? (m.decimals as number) : 0}
                    prefix={"prefix" in m ? (m.prefix as string) : ""}
                    suffix={m.suffix}
                    className="font-display text-[clamp(1.6rem,3vw,2.4rem)] font-bold tracking-[-0.02em] text-ink"
                  />
                  <span className="font-mono text-[0.66rem] text-muted">{m.caption}</span>
                </div>
              ))}
            </div>

            {/* Right: live chip (always visible on desktop, drops below on mobile) */}
            <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
              <span
                aria-hidden
                className="acid-animate h-2 w-2 rounded-full bg-success"
                style={{
                  boxShadow: "0 0 10px var(--color-success)",
                  animation: "acid-pulse 2s infinite",
                }}
              />
              <span className="font-mono text-[0.66rem] tracking-[0.18em] text-success uppercase">
                Live · simulated
              </span>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}