import axios from "axios";
import { CreateOrder, Depth, KLine, Ticker, Trade, UserId, Balance, OpenOrder, OrderHistory, Market, CreateTradeRequest, TradeGroup } from "./types";

const BASE_URL = "http://localhost:8080/api/v1";

export async function getDepth(market: string): Promise<Depth> {
  const response = await axios.get(`${BASE_URL}/market-data/orderbook?symbol=${market}&limit=20`);
  const { data } = response.data;
  return {
    bids: data.bids,
    asks: data.asks,
    lastUpdateId: String(data.nonce || data.timestamp),
  };
}
export async function getTrades(market: string): Promise<Trade[]> {
  const response = await axios.get(`${BASE_URL}/trades?symbol=${market}`);
  return response.data;
}

// Map interval string to milliseconds
function intervalToMs(interval: string): number {
  const match = interval.match(/^(\d+)([smhdwM])$/);
  if (!match) return 3600000; // Default 1h
  const [, num, unit] = match;
  const n = parseInt(num, 10);
  switch (unit) {
    case 's': return n * 1000;
    case 'm': return n * 60 * 1000;
    case 'h': return n * 60 * 60 * 1000;
    case 'd': return n * 24 * 60 * 60 * 1000;
    case 'w': return n * 7 * 24 * 60 * 60 * 1000;
    case 'M': return n * 30 * 24 * 60 * 60 * 1000; // Approximate
    default: return 3600000;
  }
}

export async function getKlines(
  market: string,
  interval: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _startTime?: number // Not used - backend fetches latest klines
): Promise<KLine[]> {
  const response = await axios.get(`${BASE_URL}/market-data/klines?symbol=${market}&interval=${interval}&limit=500`);
  const { data } = response.data;
  const intervalMs = intervalToMs(interval);
  // Transform from backend format to frontend KLine format
  const klines: KLine[] = data.map((k: { timestamp: number; open: string; high: string; low: string; close: string; volume: string; quote_volume: string }) => ({
    open: k.open,
    high: k.high,
    low: k.low,
    close: k.close,
    volume: k.volume,
    quoteVolume: k.quote_volume,
    start: String(k.timestamp),
    end: String(k.timestamp + intervalMs),
    trades: "0",
  }));
  return klines.sort((x, y) => (Number(x.end) < Number(y.end) ? -1 : 1));
}

export async function getTicker(market: string): Promise<Ticker> {
  const response = await axios.get(`${BASE_URL}/market-data/ticker?symbol=${market}`);
  const { data } = response.data;
  // Transform from backend format to frontend Ticker format
  return {
    symbol: data.symbol,
    lastPrice: data.last,
    firstPrice: data.last, // Not provided by backend, use last
    high: data.ask, // Using ask as proxy for high
    low: data.bid, // Using bid as proxy for low
    priceChange: "0",
    priceChangePercent: data.percentage,
    volume: data.base_volume,
    quoteVolume: data.quote_volume,
    trades: "0",
  };
}

export async function getTickers(): Promise<Ticker[]> {
  // Get ticker for common markets
  const markets = ['SOL_USDC', 'BTC_USDC', 'ETH_USDC'];
  const tickers = await Promise.all(
    markets.map(async (market) => {
      try {
        return await getTicker(market);
      } catch {
        return null;
      }
    })
  );
  return tickers.filter((t): t is Ticker => t !== null);
}

export async function createOrder(order: CreateOrder): Promise<string> {
  const response = await axios.post(`${BASE_URL}/order`, {
    market: order.market,
    side: order.side,
    quantity: order.quantity,
    price: order.price,
    user_id: order.userId,
    execution_mode: order.executionMode ?? 'shadow',
  });
  return response.data;
}

export async function createUser(): Promise<UserId> {
  const response = await axios.post(`${BASE_URL}/users`);
  return response.data;
}

export async function getBalances(userId: string): Promise<Balance[]> {
  const response = await axios.get(`${BASE_URL}/balances?user_id=${userId}`);
  return response.data;
}

export async function getOpenOrders(userId: string, market?: string): Promise<OpenOrder[]> {
  const params = new URLSearchParams({ user_id: userId });
  if (market) {
    params.append('symbol', market);
  }
  const response = await axios.get(`${BASE_URL}/orders?${params.toString()}`);
  return response.data;
}

export async function cancelOrder(orderId: string, userId: string): Promise<void> {
  await axios.delete(`${BASE_URL}/order`, {
    data: { order_id: orderId, user_id: userId }
  });
}

export async function getOrderHistory(userId: string, market?: string): Promise<OrderHistory[]> {
  const params = new URLSearchParams({ user_id: userId });
  if (market) {
    params.append('symbol', market);
  }
  const response = await axios.get(`${BASE_URL}/order-history?${params.toString()}`);
  return response.data;
}

export async function getMarkets(): Promise<Market[]> {
  try {
    const response = await axios.get(`${BASE_URL}/market-data/markets`);
    const { data } = response.data;
    return data.map((m: { symbol: string; base_asset: string; quote_asset: string }) => ({
      symbol: m.symbol,
      baseAsset: m.base_asset,
      quoteAsset: m.quote_asset,
      status: 'TRADING' as const,
    }));
  } catch {
    // Fallback to hardcoded markets if API doesn't support this endpoint
    return [
      { symbol: 'SOL_USDC', baseAsset: 'SOL', quoteAsset: 'USDC', status: 'TRADING' },
      { symbol: 'BTC_USDC', baseAsset: 'BTC', quoteAsset: 'USDC', status: 'TRADING' },
      { symbol: 'ETH_USDC', baseAsset: 'ETH', quoteAsset: 'USDC', status: 'TRADING' },
    ];
  }
}

// Trade Management API (D.0)

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function createTrade(trade: CreateTradeRequest, userId: string): Promise<TradeGroup> {
  const response = await axios.post<ApiResponse<TradeGroup>>(
    `${BASE_URL}/trades`,
    trade,
    { headers: { 'X-User-Id': userId } }
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to create trade');
  }
  return response.data.data;
}

export async function getTradeGroups(userId: string): Promise<TradeGroup[]> {
  const response = await axios.get<ApiResponse<TradeGroup[]>>(
    `${BASE_URL}/trades`,
    { headers: { 'X-User-Id': userId } }
  );
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to get trades');
  }
  return response.data.data || [];
}

export async function getTrade(tradeId: string, userId: string): Promise<TradeGroup> {
  const response = await axios.get<ApiResponse<TradeGroup>>(
    `${BASE_URL}/trades/${tradeId}`,
    { headers: { 'X-User-Id': userId } }
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Trade not found');
  }
  return response.data.data;
}

export async function updateStopLoss(tradeId: string, price: number, userId: string): Promise<TradeGroup> {
  const response = await axios.put<ApiResponse<TradeGroup>>(
    `${BASE_URL}/trades/${tradeId}/sl`,
    { price },
    { headers: { 'X-User-Id': userId } }
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to update stop loss');
  }
  return response.data.data;
}

export async function updateTakeProfit(
  tradeId: string,
  price: number,
  percentToClose: number,
  userId: string
): Promise<TradeGroup> {
  const response = await axios.put<ApiResponse<TradeGroup>>(
    `${BASE_URL}/trades/${tradeId}/tp`,
    { price, percent_to_close: percentToClose },
    { headers: { 'X-User-Id': userId } }
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to update take profit');
  }
  return response.data.data;
}

export async function enableBreakEven(
  tradeId: string,
  triggerPercent: number,
  offset: number | undefined,
  userId: string
): Promise<TradeGroup> {
  const response = await axios.put<ApiResponse<TradeGroup>>(
    `${BASE_URL}/trades/${tradeId}/breakeven`,
    { trigger_percent: triggerPercent, offset },
    { headers: { 'X-User-Id': userId } }
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to enable break-even');
  }
  return response.data.data;
}

export async function cancelTrade(tradeId: string, userId: string): Promise<void> {
  const response = await axios.delete<ApiResponse<string>>(
    `${BASE_URL}/trades/${tradeId}`,
    { headers: { 'X-User-Id': userId } }
  );
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to cancel trade');
  }
}
