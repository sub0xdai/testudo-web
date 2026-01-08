import axios from "axios";
import { CreateOrder, Depth, KLine, Ticker, Trade, UserId, Balance, OpenOrder, OrderHistory } from "./types";

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
