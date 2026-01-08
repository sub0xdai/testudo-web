import { useState, useEffect, useCallback, useMemo } from 'react';
import { Balance } from '../../utils/types';
import { getBalances } from '../../utils/requests';
import { formatQuantity, formatUSD, parseMarketSymbol } from '../../utils/format';
import { Skeleton } from './Skeleton';

interface BalanceDisplayProps {
  market: string;
  currentPrice: number;
}

type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Displays user's balances for the current trading pair
 * Shows available and locked amounts with USD value
 */
export function BalanceDisplay({ market, currentPrice }: BalanceDisplayProps) {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);

  const { base, quote } = useMemo(() => parseMarketSymbol(market), [market]);

  const fetchBalances = useCallback(async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      setLoadingState('idle');
      return;
    }

    setLoadingState('loading');
    setError(null);

    try {
      const data = await getBalances(userId);
      setBalances(data);
      setLoadingState('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load balances';
      setError(message);
      setLoadingState('error');
    }
  }, []);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const baseBalance = useMemo(() => {
    return balances.find(b => b.asset === base);
  }, [balances, base]);

  const quoteBalance = useMemo(() => {
    return balances.find(b => b.asset === quote);
  }, [balances, quote]);

  const baseAvailable = parseFloat(baseBalance?.available ?? '0');
  const quoteAvailable = parseFloat(quoteBalance?.available ?? '0');
  const baseUsdValue = baseAvailable * currentPrice;

  if (loadingState === 'idle') {
    return null;
  }

  if (loadingState === 'loading') {
    return <BalanceSkeleton />;
  }

  if (loadingState === 'error') {
    return (
      <div className="flex items-center justify-between px-3 py-2 bg-negative-red/10 rounded-lg">
        <span className="text-xs text-negative-red">{error}</span>
        <button
          onClick={fetchBalances}
          className="text-xs text-interactive-link hover:text-interactive-link-hover transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span>Balances</span>
        <button
          onClick={fetchBalances}
          className="text-interactive-link hover:text-interactive-link-hover transition-colors"
          aria-label="Refresh balances"
        >
          <RefreshIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Base asset balance */}
        <BalanceItem
          asset={base}
          amount={baseAvailable}
          usdValue={baseUsdValue}
          locked={parseFloat(baseBalance?.locked ?? '0')}
        />

        {/* Quote asset balance */}
        <BalanceItem
          asset={quote}
          amount={quoteAvailable}
          usdValue={quoteAvailable}
          locked={parseFloat(quoteBalance?.locked ?? '0')}
          isQuote
        />
      </div>
    </div>
  );
}

interface BalanceItemProps {
  asset: string;
  amount: number;
  usdValue: number;
  locked: number;
  isQuote?: boolean;
}

function BalanceItem({ asset, amount, usdValue, locked, isQuote = false }: BalanceItemProps) {
  const hasLocked = locked > 0;

  return (
    <div className="flex flex-col gap-1 p-2 bg-container-bg-hover/50 rounded-lg">
      <div className="flex items-center gap-1.5">
        <img
          src={`/${asset.toLowerCase()}.svg`}
          alt={asset}
          className="w-4 h-4 rounded-full"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <span className="text-xs text-text-secondary">{asset}</span>
      </div>

      <div className="font-numeral text-sm text-text-default">
        {formatQuantity(amount, { decimals: isQuote ? 2 : 4 })}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary font-numeral">
          {formatUSD(usdValue)}
        </span>
        {hasLocked && (
          <span className="text-xs text-amber-500 font-numeral" title="Locked in orders">
            {formatQuantity(locked)} locked
          </span>
        )}
      </div>
    </div>
  );
}

function BalanceSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width={60} height={12} />
        <Skeleton variant="circular" width={14} height={14} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-container-bg-hover/50 rounded-lg">
          <Skeleton variant="text" width={40} height={12} className="mb-1" />
          <Skeleton variant="text" width={60} height={16} className="mb-1" />
          <Skeleton variant="text" width={50} height={12} />
        </div>
        <div className="p-2 bg-container-bg-hover/50 rounded-lg">
          <Skeleton variant="text" width={40} height={12} className="mb-1" />
          <Skeleton variant="text" width={60} height={16} className="mb-1" />
          <Skeleton variant="text" width={50} height={12} />
        </div>
      </div>
    </div>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

export default BalanceDisplay;
