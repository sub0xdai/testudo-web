import axios from "axios";
import { CreateOrder, Depth, KLine, Ticker, Trade, UserId, Balance, OpenOrder, OrderHistory, Market, CreateTradeRequest, TradeGroup } from "./types";

const BASE_URL = "http://localhost:8080/api/v1";

export async function getDepth(market: string): Promise<Depth> {
  const response = await axios.get(`${BASE_URL}/depth?symbol=${market}`);
  return response.data;
}
export async function getTrades(market: string): Promise<Trade[]> {
  const response = await axios.get(`${BASE_URL}/trades?symbol=${market}`);
  return response.data;
}

export async function getKlines(
  market: string,
  interval: string,
  startTime: number
): Promise<KLine[]> {
  const response = await axios.get(
    `${BASE_URL}/klines?symbol=${market}&interval=${interval}&startTime=${startTime}`
  );
  const data: KLine[] = response.data;
  return data.sort((x, y) => (Number(x.end) < Number(y.end) ? -1 : 1));
}

export async function getTicker(market: string): Promise<Ticker> {
  const tickers = await getTickers();
  const ticker = tickers.find((t) => t.symbol === market);
  if (!ticker) {
    throw new Error(`No ticker found for ${market}`);
  }
  return ticker;
}

export async function getTickers(): Promise<Ticker[]> {
  const response = await axios.get(`${BASE_URL}/tickers`);
  return response.data;
}

export async function createOrder(order: CreateOrder): Promise<string> {
  const response = await axios.post(`${BASE_URL}/order`, {
    market: order.market,
    side: order.side,
    quantity: order.quantity,
    price: order.price,
    user_id: order.userId,
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
    const response = await axios.get(`${BASE_URL}/markets`);
    return response.data;
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
