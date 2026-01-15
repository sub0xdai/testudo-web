import { useState, useEffect, useCallback, useMemo } from 'react';
import { Balance } from '../utils/types';
import { getBalances, resetPaperBalance } from '../utils/requests';
import { parseMarketSymbol } from '../utils/format';

interface UseBalancesOptions {
  market: string;
  pollInterval?: number;
}

interface UseBalancesReturn {
  balances: Balance[];
  baseBalance: Balance | undefined;
  quoteBalance: Balance | undefined;
  isLoading: boolean;
  isResetting: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  reset: () => Promise<void>;
}

/**
 * Custom hook for managing user balances
 * Uses polling to fetch balance updates
 */
export function useBalances({
  market,
  pollInterval = 10000,
}: UseBalancesOptions): UseBalancesReturn {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
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

  const resetBalance = useCallback(async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    setIsResetting(true);
    try {
      const data = await resetPaperBalance(userId);
      setBalances(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset balance';
      setError(message);
    } finally {
      setIsResetting(false);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchBalances();

    // Set up polling
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
    isResetting,
    error,
    refresh: fetchBalances,
    reset: resetBalance,
  };
}

export default useBalances;
