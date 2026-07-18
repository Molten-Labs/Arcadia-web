"use client";

import { useEffect, useRef, useMemo } from "react";
import {
  createChart,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
} from "lightweight-charts";
import type {
  IChartApi,
  ISeriesApi,
  CandlestickData,
  IPriceLine,
  Time,
} from "lightweight-charts";

// Read an acid token from the :root mirror. lightweight-charts renders to a
// canvas and cannot resolve var(), so we resolve concrete strings at runtime
// with literal fallbacks that match the acid palette.
function readToken(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

// Append an alpha channel to a 6-digit hex color, yielding 8-digit hex.
function withAlpha(hex: string, alpha: number): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

const SEED_PRICES: Record<string, number> = {
  "SOL-PERP": 152.4,
  "BTC-PERP": 67420,
  "ETH-PERP": 3488,
  "ARB-PERP": 1.22,
};

function generateCandles(market: string, basePrice: number, count = 150): CandlestickData[] {
  const now = Math.floor(Date.now() / 1000);
  const intervalSecs = 900;
  const candles: CandlestickData[] = [];
  let price = basePrice * (0.88 + (market.charCodeAt(0) % 7) * 0.004);
  const volatility = basePrice * 0.006;

  for (let i = count - 1; i >= 0; i--) {
    const time = (now - i * intervalSecs) as Time;
    const open = price;
    const drift = (Math.random() - 0.47) * volatility;
    const close = Math.max(open + drift, basePrice * 0.5);
    const wick = volatility * 0.4;
    const high = Math.max(open, close) + Math.random() * wick;
    const low = Math.min(open, close) - Math.random() * wick;
    candles.push({ time, open, high, low, close });
    price = close;
  }
  return candles;
}

export interface PositionMarker {
  id: string;
  direction: "long" | "short";
  entry_px: number;
  size_usd: number;
  leverage: number;
  takeProfit?: number;
  stopLoss?: number;
  liquidation?: number;
}

/** Live preview snapshot rendered while the user edits the order form. */
export interface ChartPreview {
  direction: "long" | "short";
  orderType: "Market" | "Limit" | "TP/SL";
  limitPrice?: number;
  takeProfit?: number;
  stopLoss?: number;
  liquidation?: number;
}

interface Props {
  market: string;
  currentPrice?: number;
  height?: number;
  fullHeight?: boolean;
  positions?: PositionMarker[];
  externalCandles?: { time: number; open: number; high: number; low: number; close: number }[];
  preview?: ChartPreview | null;
}

export function TvChart({ market, currentPrice, height = 360, fullHeight = false, positions = [], externalCandles, preview }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceLinesRef = useRef<Map<string, IPriceLine>>(new Map());

  const candles = useMemo(() => {
    if (externalCandles && externalCandles.length > 0) {
      // setData asserts on non-ascending times: normalize ms -> s, sort,
      // and drop duplicate timestamps (keep the latest update for a bucket).
      const bySecond = new Map<number, CandlestickData>();
      for (const c of externalCandles) {
        const t = c.time > 1e12 ? Math.floor(c.time / 1000) : c.time;
        bySecond.set(t, { time: t as Time, open: c.open, high: c.high, low: c.low, close: c.close });
      }
      return [...bySecond.values()].sort((a, b) => (a.time as number) - (b.time as number));
    }
    return generateCandles(market, SEED_PRICES[market] ?? 100);
  }, [market, externalCandles]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Resolve acid tokens once at chart-creation time (canvas needs literals).
    const panel   = readToken("--color-panel",   "#0d0d14");
    const line    = readToken("--color-line",    "#1c1c1c");
    const faint   = readToken("--color-faint",   "#5C6470");
    const panel2  = readToken("--color-panel-2", "#14141c");
    const acid    = readToken("--color-acid",    "#CCFF00");
    const success = readToken("--color-success", "#34E29B");
    const danger  = readToken("--color-danger",  "#FF3B6B");
    const crosshair = withAlpha(acid, 0.4);

    // Snapshot the price-line map this effect owns so cleanup uses a stable ref.
    const priceLines = priceLinesRef.current;

    const resolvedHeight = fullHeight
      ? (container.clientHeight || 400)
      : height;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: panel },
        textColor: faint,
        fontSize: 11,
        fontFamily: "'Space Mono', ui-monospace, 'Menlo', monospace",
      },
      grid: {
        vertLines: { color: line, style: 1 },
        horzLines: { color: line, style: 1 },
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { color: crosshair, labelBackgroundColor: panel2 },
        horzLine: { color: crosshair, labelBackgroundColor: panel2 },
      },
      timeScale: {
        borderColor: line,
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: false,
        lockVisibleTimeRangeOnResize: true,
      },
      rightPriceScale: {
        borderColor: line,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
      width: container.clientWidth,
      height: resolvedHeight,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: success,
      downColor: danger,
      borderUpColor: success,
      borderDownColor: danger,
      wickUpColor: withAlpha(success, 0.5),
      wickDownColor: withAlpha(danger, 0.5),
    });

    series.setData(candles);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;
    priceLines.clear();

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        const newH = fullHeight
          ? (containerRef.current.clientHeight || 400)
          : height;
        chart.applyOptions({ width: containerRef.current.clientWidth, height: newH });
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      priceLines.clear();
    };
  }, [candles, height, fullHeight]);

  // Sync price lines with open positions (entry + TP + SL + liquidation)
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    const longColor  = readToken("--color-success", "#34E29B");
    const shortColor = readToken("--color-danger",  "#FF3B6B");
    const tpColor   = "#34E29B";
    const slColor    = "#FF3B6B";
    const liqColor   = "#d8a93a";

    const existing = priceLinesRef.current;

    // Compute the set of keys that should exist (positions + their TP/SL/liq).
    const wantedKeys = new Set<string>();
    for (const pos of positions) {
      wantedKeys.add(pos.id);
      if (pos.takeProfit && pos.takeProfit > 0) wantedKeys.add(`${pos.id}:tp`);
      if (pos.stopLoss && pos.stopLoss > 0) wantedKeys.add(`${pos.id}:sl`);
      if (pos.liquidation && pos.liquidation > 0) wantedKeys.add(`${pos.id}:liq`);
    }

    // Remove stale lines (any key not wanted and not a preview).
    for (const [id, line] of existing) {
      if (id.startsWith("preview:")) continue;
      if (!wantedKeys.has(id)) {
        try { series.removePriceLine(line); } catch { /* already removed */ }
        existing.delete(id);
      }
    }

    // Add/update lines for each position. We recreate child lines if the
    // underlying price changed since the last render.
    for (const pos of positions) {
      const isLong = pos.direction === "long";
      const color = isLong ? longColor : shortColor;
      const label = `${isLong ? "▲ LONG" : "▼ SHORT"} ${pos.leverage}x · $${pos.size_usd.toLocaleString()}`;

      if (!existing.has(pos.id)) {
        const line = series.createPriceLine({
          price: pos.entry_px,
          color,
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: label,
        });
        existing.set(pos.id, line);
      }

      const ensureChild = (key: string, price: number, c: string, style: LineStyle, title: string) => {
        const prev = existing.get(key);
        // lightweight-charts doesn't expose a price setter on price lines,
        // so we recreate the line whenever the price changes.
        if (prev) {
          try { series.removePriceLine(prev); } catch { /* noop */ }
        }
        const line = series.createPriceLine({
          price,
          color: c,
          lineWidth: 1,
          lineStyle: style,
          axisLabelVisible: true,
          title,
        });
        existing.set(key, line);
      };

      if (pos.takeProfit && pos.takeProfit > 0) {
        ensureChild(`${pos.id}:tp`, pos.takeProfit, tpColor, LineStyle.Dashed, `TP ${label}`);
      } else {
        const prev = existing.get(`${pos.id}:tp`);
        if (prev) {
          try { series.removePriceLine(prev); } catch { /* noop */ }
          existing.delete(`${pos.id}:tp`);
        }
      }

      if (pos.stopLoss && pos.stopLoss > 0) {
        ensureChild(`${pos.id}:sl`, pos.stopLoss, slColor, LineStyle.Dashed, `SL ${label}`);
      } else {
        const prev = existing.get(`${pos.id}:sl`);
        if (prev) {
          try { series.removePriceLine(prev); } catch { /* noop */ }
          existing.delete(`${pos.id}:sl`);
        }
      }

      if (pos.liquidation && pos.liquidation > 0) {
        ensureChild(`${pos.id}:liq`, pos.liquidation, liqColor, LineStyle.Dotted, `Liq ${label}`);
      } else {
        const prev = existing.get(`${pos.id}:liq`);
        if (prev) {
          try { series.removePriceLine(prev); } catch { /* noop */ }
          existing.delete(`${pos.id}:liq`);
        }
      }
    }
  }, [positions]);

  // Live preview lines: dashed and slightly transparent so they read as
  // "what would happen" rather than committed orders. Recreated every paint
  // because the underlying numeric values change as the user types.
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    const existing = priceLinesRef.current;

    // Clear old previews.
    for (const key of [...existing.keys()]) {
      if (key.startsWith("preview:")) {
        const line = existing.get(key);
        if (line) {
          try { series.removePriceLine(line); } catch { /* noop */ }
        }
        existing.delete(key);
      }
    }

    if (!preview) return;

    const half = (hex: string) => hex; // passthrough; alpha added via color-mix below
    void half;

    const make = (key: string, price: number, hex: string, title: string) => {
      if (!price || price <= 0) return;
      const line = series.createPriceLine({
        price,
        color: withAlpha(hex, 0.55),
        lineWidth: 1,
        lineStyle: LineStyle.LargeDashed,
        axisLabelVisible: true,
        title,
      });
      existing.set(key, line);
    };

    // Entry / reference line for previews: a thin marker at the limit price
    // (orange) so the user can see where a limit order would rest.
    if (preview.orderType === "Limit" && preview.limitPrice) {
      make("preview:limit", preview.limitPrice, "#ffb84d", `Limit ▶ ${preview.limitPrice.toFixed(2)}`);
    }

    if (preview.takeProfit) {
      make("preview:tp", preview.takeProfit, "#34E29B", `TP ▶ ${preview.takeProfit.toFixed(2)}`);
    }
    if (preview.stopLoss) {
      make("preview:sl", preview.stopLoss, "#FF3B6B", `SL ▶ ${preview.stopLoss.toFixed(2)}`);
    }
    if (preview.liquidation) {
      make("preview:liq", preview.liquidation, "#d8a93a", `Liq ▶ ${preview.liquidation.toFixed(2)}`);
    }
  }, [preview]);

  // Live-tick: update the last candle's close/high/low
  useEffect(() => {
    if (!seriesRef.current || currentPrice == null || candles.length === 0) return;
    const last = candles[candles.length - 1];
    seriesRef.current.update({
      time: last.time,
      open: last.open,
      high: Math.max(last.high, currentPrice),
      low: Math.min(last.low, currentPrice),
      close: currentPrice,
    });
  }, [currentPrice, candles]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: fullHeight ? "100%" : height }}
      className="overflow-hidden"
    />
  );
}
