const BINANCE_WS_BASE = "wss://fstream.binance.com/stream";

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

interface DepthUpdate {
  bids: [string, string][];
  asks: [string, string][];
  finalUpdateId: number;
}

interface TradeUpdate {
  id: number;
  price: string;
  quantity: string;
  timestamp: number;
  isBuyerMaker: boolean;
}

interface BookTickerUpdate {
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
}

interface KlineUpdate {
  startTime: number;
  closeTime: number;
  interval: string;
  open: string;
  close: string;
  high: string;
  low: string;
  volume: string;
  isClosed: boolean;
}

type DepthCallback = (data: DepthUpdate) => void;
type TradeCallback = (data: TradeUpdate) => void;
type BookTickerCallback = (data: BookTickerUpdate) => void;
type KlineCallback = (data: KlineUpdate) => void;
type ConnectionCallback = (state: ConnectionState) => void;

const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const RECONNECT_MULTIPLIER = 2;

export class BinanceWsManager {
  private ws: WebSocket | null = null;
  private currentSymbol: string | null = null;
  private currentKlineInterval: string = '1m';
  private connectionState: ConnectionState = 'disconnected';

  private depthCallbacks: Map<string, DepthCallback> = new Map();
  private tradeCallbacks: Map<string, TradeCallback> = new Map();
  private bookTickerCallbacks: Map<string, BookTickerCallback> = new Map();
  private klineCallbacks: Map<string, KlineCallback> = new Map();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();

  private reconnectAttempts = 0;
  private reconnectDelay = INITIAL_RECONNECT_DELAY;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;

  private static instance: BinanceWsManager;

  private constructor() {}

  public static getInstance(): BinanceWsManager {
    if (!BinanceWsManager.instance) {
      BinanceWsManager.instance = new BinanceWsManager();
    }
    return BinanceWsManager.instance;
  }

  public subscribe(symbol: string, klineInterval: string = '1m'): void {
    const normalizedSymbol = symbol.toLowerCase();
    const needsReconnect = this.currentSymbol !== normalizedSymbol || this.currentKlineInterval !== klineInterval;

    if (!needsReconnect && this.ws?.readyState === WebSocket.OPEN) {
      return;
    }
    if (this.ws) {
      this.shouldReconnect = false;
      this.ws.close();
    }
    this.currentSymbol = normalizedSymbol;
    this.currentKlineInterval = klineInterval;
    this.shouldReconnect = true;
    this.connect();
  }

  public unsubscribe(): void {
    this.shouldReconnect = false;
    this.currentSymbol = null;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setConnectionState('disconnected');
  }

  private connect(): void {
    if (!this.currentSymbol) return;
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }
    this.setConnectionState('connecting');
    const streams = [
      `${this.currentSymbol}@depth@100ms`,
      `${this.currentSymbol}@aggTrade`,
      `${this.currentSymbol}@bookTicker`,
      `${this.currentSymbol}@kline_${this.currentKlineInterval}`,
    ].join('/');
    const url = `${BINANCE_WS_BASE}?streams=${streams}`;
    try {
      this.ws = new WebSocket(url);
      this.setupEventHandlers();
    } catch {
      this.handleConnectionError();
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.reconnectDelay = INITIAL_RECONNECT_DELAY;
      this.setConnectionState('connected');
    };
    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch {
        // Ignore parse errors
      }
    };
    this.ws.onclose = () => {
      this.setConnectionState('disconnected');
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    };
    this.ws.onerror = () => {
      this.handleConnectionError();
    };
  }

  private handleMessage(message: { stream: string; data: unknown }): void {
    const { stream, data } = message;
    if (stream.endsWith('@depth@100ms')) {
      this.handleDepthUpdate(data);
    } else if (stream.endsWith('@aggTrade')) {
      this.handleTradeUpdate(data);
    } else if (stream.endsWith('@bookTicker')) {
      this.handleBookTickerUpdate(data);
    } else if (stream.includes('@kline_')) {
      this.handleKlineUpdate(data);
    }
  }

  private handleDepthUpdate(data: unknown): void {
    const d = data as { b: [string, string][]; a: [string, string][]; u: number };
    const update: DepthUpdate = { bids: d.b, asks: d.a, finalUpdateId: d.u };
    this.depthCallbacks.forEach((callback) => callback(update));
  }

  private handleTradeUpdate(data: unknown): void {
    const d = data as { a: number; p: string; q: string; T: number; m: boolean };
    const update: TradeUpdate = {
      id: d.a,
      price: d.p,
      quantity: d.q,
      timestamp: d.T,
      isBuyerMaker: d.m,
    };
    this.tradeCallbacks.forEach((callback) => callback(update));
  }

  private handleBookTickerUpdate(data: unknown): void {
    const d = data as { b: string; B: string; a: string; A: string };
    const update: BookTickerUpdate = {
      bidPrice: d.b,
      bidQty: d.B,
      askPrice: d.a,
      askQty: d.A,
    };
    this.bookTickerCallbacks.forEach((callback) => callback(update));
  }

  private handleKlineUpdate(data: unknown): void {
    const d = data as {
      k: {
        t: number;
        T: number;
        i: string;
        o: string;
        c: string;
        h: string;
        l: string;
        v: string;
        x: boolean;
      };
    };
    const update: KlineUpdate = {
      startTime: d.k.t,
      closeTime: d.k.T,
      interval: d.k.i,
      open: d.k.o,
      close: d.k.c,
      high: d.k.h,
      low: d.k.l,
      volume: d.k.v,
      isClosed: d.k.x,
    };
    this.klineCallbacks.forEach((callback) => callback(update));
  }

  private handleConnectionError(): void {
    this.setConnectionState('error');
    if (this.shouldReconnect) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.reconnectDelay = Math.min(this.reconnectDelay * RECONNECT_MULTIPLIER, MAX_RECONNECT_DELAY);
      this.connect();
    }, this.reconnectDelay);
  }

  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.connectionCallbacks.forEach((cb) => cb(state));
    }
  }

  public onDepthUpdate(id: string, callback: DepthCallback): () => void {
    this.depthCallbacks.set(id, callback);
    return () => this.depthCallbacks.delete(id);
  }

  public onTradeUpdate(id: string, callback: TradeCallback): () => void {
    this.tradeCallbacks.set(id, callback);
    return () => this.tradeCallbacks.delete(id);
  }

  public onBookTickerUpdate(id: string, callback: BookTickerCallback): () => void {
    this.bookTickerCallbacks.set(id, callback);
    return () => this.bookTickerCallbacks.delete(id);
  }

  public onKlineUpdate(id: string, callback: KlineCallback): () => void {
    this.klineCallbacks.set(id, callback);
    return () => this.klineCallbacks.delete(id);
  }

  public onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    callback(this.connectionState);
    return () => this.connectionCallbacks.delete(callback);
  }

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }
}
