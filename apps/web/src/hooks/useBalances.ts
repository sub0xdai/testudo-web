import { useState, useEffect, useCallback, useMemo } from 'react';
import { Balance } from '../utils/types';
import { getBalances } from '../utils/requests';
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
  error: string | null;
  refresh: () => Promise<void>;
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
    error,
    refresh: fetchBalances,
  };
}

export default useBalances;
