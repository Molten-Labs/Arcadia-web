/** Shared types for the trading terminal and its extracted panels. */

export type Direction = "long" | "short";
export type OrderType = "Market" | "Limit" | "TP/SL";

/** Time-in-force. Pro venues expose GTC / IOC / FOK / PostOnly. */
export type TimeInForce = "GTC" | "IOC" | "FOK" | "PostOnly";

/** Margin mode for a position. Cross = shared collateral, Isolated = per-position. */
export type MarginMode = "cross" | "isolated";

export const TIF_OPTIONS: TimeInForce[] = ["GTC", "IOC", "FOK", "PostOnly"];
export const MARGIN_MODES: MarginMode[] = ["cross", "isolated"];

/** Live preview snapshot the chart renders while the user edits the form. */
export interface OrderPreview {
  direction: Direction;
  orderType: OrderType;
  limitPrice?: number;
  takeProfit?: number;
  stopLoss?: number;
  /** Estimated liquidation price for the configured leverage/size. */
  liquidation?: number;
}

/** A pending order request emitted by the form on submit. */
export interface SubmittedOrder {
  orderType: OrderType;
  direction: Direction;
  sizeUSD: number;
  leverage: number;
  limitPrice?: number;
  takeProfit?: number;
  stopLoss?: number;
  reduceOnly: boolean;
  tif: TimeInForce;
  marginMode: MarginMode;
}