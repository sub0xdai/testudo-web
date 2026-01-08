import { useState, useEffect, useCallback, useMemo } from 'react';
import { Balance } from '../utils/types';
import { getBalances } from '../utils/requests';
import { WsManager } from '../utils/ws_manager';
import { parseMarketSymbol } from '../utils/format';

interface UseBalancesOptions {
  market: string;
  pollInterval?: number;
  enableWebSocket?: boolean;
}

interface UseBalancesReturn {
  balances: Balance[];
  baseBalance: Balance | undefined;
  quoteBalance: Balance | undefined;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for managing user balances with real-time updates
 * Uses WebSocket when available, falls back to polling
 */
export function useBalances({
  market,
  pollInterval = 10000,
  enableWebSocket = true,
}: UseBalancesOptions): UseBalancesReturn {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { base, quote } = useMemo(() => parseMarketSymbol(market), [market]);

  const fetchBalances = useCallback(async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await getBalances(userId);
      setBalances(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load balances';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // WebSocket subscription for real-time updates
  useEffect(() => {
    if (!enableWebSocket) return;

    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    const wsManager = WsManager.getInstance();

    // Subscribe to balance updates
    // Note: Backend must support 'balance' WebSocket channel
    wsManager.registerCallback(
      'balance',
      (data) => {
        // Handle balance update from WebSocket
        const balanceData = data as { asset: string; available: string; locked: string };
        if (balanceData?.asset) {
          setBalances((prev) => {
            const existing = prev.findIndex((b) => b.asset === balanceData.asset);
            if (existing !== -1) {
              const updated = [...prev];
              updated[existing] = {
                ...updated[existing],
                available: balanceData.available,
                locked: balanceData.locked,
              };
              return updated;
            }
            return [...prev, balanceData];
          });
        }
      },
      `balance-${userId}`
    );

    // Send subscription request
    wsManager.sendMessage({
      method: 'SUBSCRIBE',
      params: [`balance.${userId}`],
    });

    return () => {
      // Unsubscribe on cleanup
      wsManager.deRegisterCallback('balance', `balance-${userId}`);
      wsManager.sendMessage({
        method: 'UNSUBSCRIBE',
        params: [`balance.${userId}`],
      });
    };
  }, [enableWebSocket]);

  // Initial fetch and polling fallback
  useEffect(() => {
    fetchBalances();

    // Set up polling as fallback/supplement to WebSocket
    const interval = setInterval(fetchBalances, pollInterval);

    return () => clearInterval(interval);
  }, [fetchBalances, pollInterval]);

  // Refresh on market change
  useEffect(() => {
    fetchBalances();
  }, [market, fetchBalances]);

  const baseBalance = useMemo(() => {
    return balances.find((b) => b.asset === base);
  }, [balances, base]);

  const quoteBalance = useMemo(() => {
    return balances.find((b) => b.asset === quote);
  }, [balances, quote]);

  return {
    balances,
    baseBalance,
    quoteBalance,
    isLoading,
    error,
    refresh: fetchBalances,
  };
}

export default useBalances;
