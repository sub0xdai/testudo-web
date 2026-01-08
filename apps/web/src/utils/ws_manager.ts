export const BASE_URL = "ws://localhost:4000";

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';
type MessageCallback = (data: unknown) => void;
type ConnectionCallback = (state: ConnectionState) => void;

interface CallbackEntry {
  callback: MessageCallback;
  id: string;
}

const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const RECONNECT_MULTIPLIER = 2;

/**
 * WebSocket manager with automatic reconnection using exponential backoff
 */
export class WsManager {
  private ws: WebSocket | null = null;
  private static instance: WsManager;
  private bufferedMessages: unknown[] = [];
  private callbacks: Record<string, CallbackEntry[]> = {};
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private id: number = 1;
  private initialized: boolean = false;
  private connectionState: ConnectionState = 'disconnected';

  // Reconnection state
  private reconnectAttempts: number = 0;
  private reconnectDelay: number = INITIAL_RECONNECT_DELAY;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect: boolean = true;

  private constructor() {
    this.connect();
  }

  public static getInstance(): WsManager {
    if (!this.instance) {
      this.instance = new WsManager();
    }
    return this.instance;
  }

  /**
   * Get current connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Register a callback for connection state changes
   */
  public onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    // Immediately notify of current state
    callback(this.connectionState);
    // Return unsubscribe function
    return () => {
      this.connectionCallbacks.delete(callback);
    };
  }

  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.connectionCallbacks.forEach(cb => cb(state));
    }
  }

  private connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.setConnectionState('connecting');

    try {
      this.ws = new WebSocket(BASE_URL);
      this.setupEventHandlers();
    } catch {
      this.handleConnectionError();
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.initialized = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = INITIAL_RECONNECT_DELAY;
      this.setConnectionState('connected');

      // Send buffered messages
      this.bufferedMessages.forEach((message) => {
        this.ws?.send(JSON.stringify(message));
      });
      this.bufferedMessages = [];

      // Re-subscribe to all registered callbacks
      this.resubscribeAll();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const type = message.data?.e;

        if (type && this.callbacks[type]) {
          this.callbacks[type].forEach(({ callback }) => {
            if (type === "depth") {
              const updatedBids = message.data.b;
              const updatedAsks = message.data.a;
              callback({ bids: updatedBids, asks: updatedAsks });
            } else if (type === "trade") {
              callback(message.data);
            } else {
              callback(message.data);
            }
          });
        }
      } catch {
        // Silently handle parse errors
      }
    };

    this.ws.onclose = (event) => {
      this.initialized = false;

      // Don't reconnect on clean close (code 1000) unless forced
      if (event.code === 1000 && !this.shouldReconnect) {
        this.setConnectionState('disconnected');
        return;
      }

      this.setConnectionState('disconnected');
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.handleConnectionError();
    };
  }

  private handleConnectionError(): void {
    this.setConnectionState('error');
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect) return;

    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;

      // Calculate next delay with exponential backoff
      this.reconnectDelay = Math.min(
        this.reconnectDelay * RECONNECT_MULTIPLIER,
        MAX_RECONNECT_DELAY
      );

      this.connect();
    }, this.reconnectDelay);
  }

  private resubscribeAll(): void {
    // Re-send subscription messages for all registered callbacks
    const subscriptionTypes = Object.keys(this.callbacks);

    subscriptionTypes.forEach((type) => {
      if (this.callbacks[type].length > 0) {
        // Determine the correct subscription params based on type
        let params: string[] = [];
        if (type === 'depth') {
          params = ['depth.SOL_USDC'];
        } else if (type === 'trade') {
          params = ['trade.SOL_USDC'];
        }

        if (params.length > 0) {
          this.sendMessage({
            method: 'SUBSCRIBE',
            params,
          });
        }
      }
    });
  }

  /**
   * Send a message through the WebSocket
   */
  sendMessage(message: unknown): void {
    const messageToSend = {
      ...(message as object),
      id: this.id++,
    };

    if (!this.initialized || this.ws?.readyState !== WebSocket.OPEN) {
      this.bufferedMessages.push(messageToSend);
      return;
    }

    this.ws?.send(JSON.stringify(messageToSend));
  }

  /**
   * Register a callback for a specific message type
   */
  registerCallback(type: string, callback: MessageCallback, id: string): void {
    if (!this.callbacks[type]) {
      this.callbacks[type] = [];
    }

    // Check if callback with this ID already exists
    const existingIndex = this.callbacks[type].findIndex((entry) => entry.id === id);
    if (existingIndex !== -1) {
      // Update existing callback
      this.callbacks[type][existingIndex].callback = callback;
    } else {
      this.callbacks[type].push({ callback, id });
    }
  }

  /**
   * Deregister a callback for a specific message type
   */
  deRegisterCallback(type: string, id: string): void {
    if (this.callbacks[type]) {
      const index = this.callbacks[type].findIndex((entry) => entry.id === id);
      if (index !== -1) {
        this.callbacks[type].splice(index, 1);
      }
    }
  }

  /**
   * Force a reconnection attempt
   */
  reconnect(): void {
    this.shouldReconnect = true;
    this.reconnectDelay = INITIAL_RECONNECT_DELAY;
    this.reconnectAttempts = 0;

    // Close existing connection if any
    if (this.ws) {
      this.ws.close();
    }

    this.connect();
  }

  /**
   * Disconnect and stop reconnection attempts
   */
  disconnect(): void {
    this.shouldReconnect = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.initialized = false;
    this.setConnectionState('disconnected');
  }

  /**
   * Get reconnection info for debugging/display
   */
  getReconnectionInfo(): { attempts: number; nextDelay: number } {
    return {
      attempts: this.reconnectAttempts,
      nextDelay: this.reconnectDelay,
    };
  }
}
