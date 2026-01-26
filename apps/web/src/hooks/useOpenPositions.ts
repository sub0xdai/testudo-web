import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Time } from 'lightweight-charts';
import { TradeGroup } from '../utils/types';
import { getTradeGroups } from '../utils/requests';
import type { PositionLevels } from '../utils/chart_manager';

/**
 * Open position data with chart-ready levels
 */
export interface OpenPosition {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  stopLossPrice: number | null;
  takeProfitPrice: number | null;
  quantity: number;
  status: string;
  /** Chart-ready position levels (null if missing required data) */
  levels: PositionLevels | null;
}

interface UseOpenPositionsOptions {
  /** Current market symbol to filter positions */
  market: string;
  /** Polling interval in ms (default: 5000) */
  pollInterval?: number;
  /** Whether to enable polling (default: true) */
  enablePolling?: boolean;
}

interface UseOpenPositionsReturn {
  /** All open positions for the current market */
  positions: OpenPosition[];
  /** All trade groups (unfiltered) */
  allTradeGroups: TradeGroup[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Manually refresh positions */
  refresh: () => Promise<void>;
}

/**
 * Transform a TradeGroup to an OpenPosition with chart-ready levels
 */
function tradeGroupToOpenPosition(trade: TradeGroup): OpenPosition {
  const side: 'long' | 'short' = trade.entry_quantity > 0 ? 'long' : 'short';

  // DEBUG: Log raw trade data
  console.log('[tradeGroupToOpenPosition] raw trade:', {
    id: trade.id,
    entry_price: trade.entry_price,
    stop_loss_price: trade.stop_loss_price,
    take_profit_targets: trade.take_profit_targets,
  });

  // Get the first take profit target price (if any)
  // Convert to number since API may return strings
  const takeProfitPrice = trade.take_profit_targets?.[0]?.price != null
    ? Number(trade.take_profit_targets[0].price)
    : null;
  const entryPrice = trade.entry_price != null ? Number(trade.entry_price) : null;
  const stopLossPrice = trade.stop_loss_price != null ? Number(trade.stop_loss_price) : null;

  // Create chart levels if we have all required data
  // For open positions, use current time as startTime (they should extend to chart edge)
  let levels: PositionLevels | null = null;

  if (entryPrice != null && stopLossPrice != null && takeProfitPrice != null) {
    levels = {
      entry: entryPrice,
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      side,
      // Use a time in the past so the zone extends across the visible chart
      // This creates a "full-width" zone effect for open positions
      startTime: 0 as Time,
    };
  }

  return {
    id: trade.id,
    symbol: trade.symbol,
    side,
    entryPrice: entryPrice ?? 0,
    stopLossPrice,
    takeProfitPrice,
    quantity: Math.abs(Number(trade.entry_quantity)),
    status: trade.status,
    levels,
  };
}

/**
 * Custom hook for managing open positions on the chart
 *
 * Fetches trade groups from the API and provides chart-ready position data
 * for rendering persistent position lines/zones on the chart.
 */
export function useOpenPositions({
  market,
  pollInterval = 5000,
  enablePolling = true,
}: UseOpenPositionsOptions): UseOpenPositionsReturn {
  const [tradeGroups, setTradeGroups] = useState<TradeGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await getTradeGroups(userId);
      setTradeGroups(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load positions';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  // Polling
  useEffect(() => {
    if (!enablePolling) return;

    const interval = setInterval(fetchPositions, pollInterval);
    return () => clearInterval(interval);
  }, [fetchPositions, pollInterval, enablePolling]);

  // Refresh on market change
  useEffect(() => {
    fetchPositions();
  }, [market, fetchPositions]);

  // Filter and transform positions for the current market
  const positions = useMemo(() => {
    return tradeGroups
      // Filter to current market and active statuses
      .filter(trade =>
        trade.symbol === market &&
        // Include positions that are open or have pending entry
        ['Pending', 'Active', 'PartiallyFilled'].includes(trade.status)
      )
      .map(tradeGroupToOpenPosition);
  }, [tradeGroups, market]);

  return {
    positions,
    allTradeGroups: tradeGroups,
    isLoading,
    error,
    refresh: fetchPositions,
  };
}

export default useOpenPositions;
