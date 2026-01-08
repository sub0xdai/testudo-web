import { useEffect, useState, useContext, useCallback } from "react";
import { OrderBook } from "./depth/OrderBook";
import { RecentTrades } from "./depth/RecentTrades";
import { getDepth, getTrades } from "../utils/requests";
import { WsManager } from "../utils/ws_manager";
import { TradesContext } from "../state/TradesProvider";
import { Trade } from "../utils/types";

type TabType = 'orderbook' | 'recentTrades';

interface DepthProps {
  market: string;
}

/**
 * O(n) order book update using Map for lookups
 * Replaces the previous O(n²) algorithm
 */
function mergeOrderBookUpdates(
  existing: [string, string][],
  updates: [string, string][],
  sortDirection: 'asc' | 'desc',
  limit: number
): [string, string][] {
  // Create a Map for O(1) lookups
  const orderMap = new Map<string, string>();

  // Add existing orders to map
  for (const [price, size] of existing) {
    orderMap.set(price, size);
  }

  // Apply updates
  for (const [price, size] of updates) {
    if (parseFloat(size) === 0) {
      // Remove if size is 0
      orderMap.delete(price);
    } else {
      // Add or update
      orderMap.set(price, size);
    }
  }

  // Convert back to array and sort
  const result = Array.from(orderMap.entries()) as [string, string][];

  // Sort based on direction
  if (sortDirection === 'desc') {
    // Bids: highest price first
    result.sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]));
  } else {
    // Asks: lowest price first
    result.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));
  }

  // Limit results
  return result.slice(0, limit);
}

export const Depth = ({ market }: DepthProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("orderbook");

  const {
    setTrades,
    addTrade,
    setBids,
    setAsks,
    setPrice,
    orderBookRef,
    setLoading,
    setError,
    setConnectionStatus,
  } = useContext(TradesContext);

  // Depth update callback - memoized for stable reference
  const handleDepthUpdate = useCallback((rawData: unknown) => {
    const data = rawData as { bids: [string, string][]; asks: [string, string][] };
    setBids((originalBids) => {
      const current = originalBids || [];
      return mergeOrderBookUpdates(current, data.bids, 'desc', 30);
    });

    setAsks((originalAsks) => {
      const current = originalAsks || [];
      return mergeOrderBookUpdates(current, data.asks, 'asc', 30);
    });
  }, [setBids, setAsks]);

  // Trade update callback - memoized for stable reference
  const handleTradeUpdate = useCallback((rawData: unknown) => {
    const data = rawData as {
      t: number | string;
      m: boolean;
      p: string;
      q: string;
      T: number;
    };
    const newTrade: Trade = {
      id: typeof data.t === 'string' ? parseInt(data.t, 10) : data.t,
      isBuyerMaker: data.m,
      price: data.p,
      quantity: data.q,
      quoteQuantity: (parseFloat(data.p) * parseFloat(data.q)).toFixed(6),
      timestamp: data.T,
    };

    setPrice(data.p);
    addTrade(newTrade);
  }, [setPrice, addTrade]);

  useEffect(() => {
    let mounted = true;
    const ws = WsManager.getInstance();

    // Subscribe to WebSocket connection state changes
    const unsubscribeConnection = ws.onConnectionChange((state) => {
      if (mounted) {
        setConnectionStatus(state);
      }
    });

    // Register WebSocket callbacks
    ws.registerCallback("depth", handleDepthUpdate, `DEPTH-${market}`);
    ws.registerCallback("trade", handleTradeUpdate, `TRADE-${market}`);

    // Subscribe to streams
    ws.sendMessage({
      method: "SUBSCRIBE",
      params: [`depth.${market}`],
    });

    ws.sendMessage({
      method: "SUBSCRIBE",
      params: [`trade.${market}`],
    });

    // Fetch initial data
    const fetchInitialData = async () => {
      try {
        setLoading('trades', true);
        setLoading('orderBook', true);

        // Fetch trades and depth in parallel
        const [tradesData, depthData] = await Promise.all([
          getTrades(market),
          getDepth(market),
        ]);

        if (!mounted) return;

        // Process trades
        const filteredTrades = tradesData
          .filter((trade) => parseFloat(trade.quantity) !== 0)
          .slice(0, 50);

        setTrades(filteredTrades);
        if (filteredTrades.length > 0) {
          setPrice(filteredTrades[0].price);
        }
        setLoading('trades', false);

        // Process depth
        const { bids: bidsData, asks: asksData } = depthData;

        if (bidsData || asksData) {
          const filteredBids = (bidsData || [])
            .filter((bid) => parseFloat(bid[1]) !== 0)
            .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
            .slice(0, 30);

          const filteredAsks = (asksData || [])
            .filter((ask) => parseFloat(ask[1]) !== 0)
            .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
            .slice(0, 30);

          setBids(filteredBids);
          setAsks(filteredAsks);
        }

        setLoading('orderBook', false);

        // Scroll to center on initial load
        if (orderBookRef.current) {
          const halfHeight = orderBookRef.current.scrollHeight / 2;
          orderBookRef.current.scrollTo(
            0,
            halfHeight - orderBookRef.current.clientHeight / 2
          );
        }
      } catch (err) {
        if (!mounted) return;
        const errorMessage = err instanceof Error ? err.message : 'Failed to load market data';
        setError('orderBook', errorMessage);
        setError('trades', errorMessage);
        setLoading('orderBook', false);
        setLoading('trades', false);
      }
    };

    fetchInitialData();

    // Cleanup
    return () => {
      mounted = false;

      // Unsubscribe from connection state changes
      unsubscribeConnection();

      ws.deRegisterCallback("depth", `DEPTH-${market}`);
      ws.sendMessage({
        method: "UNSUBSCRIBE",
        params: [`depth.${market}`],
      });

      ws.deRegisterCallback("trade", `TRADE-${market}`);
      ws.sendMessage({
        method: "UNSUBSCRIBE",
        params: [`trade.${market}`],
      });
    };
  }, [
    market,
    orderBookRef,
    setAsks,
    setBids,
    setPrice,
    setTrades,
    addTrade,
    setLoading,
    setError,
    setConnectionStatus,
    handleDepthUpdate,
    handleTradeUpdate,
  ]);

  return (
    <div className="h-full bg-container-bg rounded-xl overflow-hidden flex border border-container-border">
      <div className="flex flex-col grow">
        {/* Tabs Section */}
        <div className="relative border-b border-container-border">
          <div className="flex" role="tablist">
            <TabButton
              label="Orderbook"
              isActive={activeTab === "orderbook"}
              onClick={() => setActiveTab("orderbook")}
            />
            <TabButton
              label="Trades"
              isActive={activeTab === "recentTrades"}
              onClick={() => setActiveTab("recentTrades")}
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "orderbook" ? <OrderBook /> : <RecentTrades />}
        </div>
      </div>
    </div>
  );
};

/**
 * Tab button component for cleaner code
 */
function TabButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={`
        py-2 px-3 flex items-center font-semibold relative
        hover:bg-container-bg-hover rounded-lg m-2
        justify-center leading-[16px] flex-1
        transition-colors duration-150
        focus:outline-none focus:ring-2 focus:ring-interactive-link/50
        ${isActive
          ? "text-text-emphasis bg-container-bg-selected"
          : "text-text-secondary hover:text-text-default"
        }
      `}
    >
      <span className="flex items-center justify-center text-sm">
        {label}
      </span>
    </button>
  );
}
