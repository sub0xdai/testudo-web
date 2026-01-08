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

export interface CreateOrder {
  market: string;
  side: string;
  quantity: number;
  price: number;
  userId: string;
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
