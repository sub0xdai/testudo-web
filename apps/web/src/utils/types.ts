export interface KLine {
  close: string;
  end: string;
  high: string;
  low: string;
  open: string;
  quoteVolume: string;
  start: string;
  trades: string;
  volume: string;
}

export interface Trade {
  id: number;
  isBuyerMaker: boolean;
  price: string;
  quantity: string;
  quoteQuantity: string;
  timestamp: number;
}

export interface Depth {
  bids: [string, string][];
  asks: [string, string][];
  lastUpdateId: string;
}

export interface Ticker {
  firstPrice: string;
  high: string;
  lastPrice: string;
  low: string;
  priceChange: string;
  priceChangePercent: string;
  quoteVolume: string;
  symbol: string;
  trades: string;
  volume: string;
}

export type ExecutionMode = 'shadow' | 'live';

export interface CreateOrder {
  market: string;
  side: string;
  quantity: number;
  price: number;
  userId: string;
  executionMode?: ExecutionMode;
}

export interface UserId {
  status: string;
  user_id: string;
}

export interface Stat {
  label: string;
  value: string;
}

export interface Balance {
  asset: string;
  available: string;
  locked: string;
}

export interface OpenOrder {
  orderId: string;
  market: string;
  side: 'BUY' | 'SELL';
  price: string;
  quantity: string;
  filledQuantity: string;
  status: 'OPEN' | 'PARTIALLY_FILLED';
  createdAt: number;
}

export interface OrderHistory {
  orderId: string;
  market: string;
  side: 'BUY' | 'SELL';
  price: string;
  quantity: string;
  filledQuantity: string;
  status: 'FILLED' | 'CANCELLED' | 'EXPIRED';
  createdAt: number;
  completedAt: number;
}

export interface PriceAlert {
  id: string;
  market: string;
  targetPrice: number;
  condition: 'above' | 'below';
  createdAt: number;
  triggered: boolean;
}

export interface Market {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: 'TRADING' | 'HALTED';
}

// Position Tool Types (D.0)
export interface PositionDraft {
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  quantity: number;
  riskAmount: number;
  riskRewardRatio: number;
}

export interface TakeProfitTarget {
  price: number;
  percentToClose: number;
}

export interface CreateTradeRequest {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  entry_price: number;
  stop_loss_price?: number;
  take_profit_price?: number;
  take_profit_targets?: TakeProfitTarget[];
  break_even_trigger_percent?: number;
  break_even_offset?: number;
}

export interface TradeGroup {
  id: string;
  symbol: string;
  entry_order_id: string;
  entry_price: number | null;
  entry_quantity: number;
  stop_loss_price: number | null;
  stop_loss_order_id: string | null;
  take_profit_targets: {
    price: number;
    percent_to_close: number;
    order_id: string | null;
    filled: boolean;
  }[];
  status: string;
  break_even_enabled: boolean;
  break_even_triggered: boolean;
}
