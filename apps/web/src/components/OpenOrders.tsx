import { useState, useEffect, useCallback, useMemo } from 'react';
import { getTradeGroups, cancelTrade } from '../utils/requests';
import { parseMarketSymbol } from '../utils/format';
import { Skeleton } from './ui/Skeleton';
import { toast } from 'sonner';

interface OpenOrdersProps {
  market: string;
  onOrderCancelled?: () => void;
}

interface TradeDisplay {
  id: string;
  market: string;
  side: 'BUY' | 'SELL';
  entryPrice: number | null;
  quantity: number;
  stopLoss: number | null;
  takeProfit: number | null;
  status: string;
}

type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Displays user's open orders with cancel functionality
 */
export function OpenOrders({ market, onOrderCancelled }: OpenOrdersProps) {
  const [orders, setOrders] = useState<TradeDisplay[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      setLoadingState('idle');
      return;
    }

    setLoadingState('loading');
    setError(null);

    try {
      const trades = await getTradeGroups(userId);
      // Filter to current market and active statuses
      const filtered = trades
        .filter(t =>
          t.symbol === market &&
          ['Pending', 'Active', 'PartiallyFilled'].includes(t.status)
        )
        .map(t => ({
          id: t.id,
          market: t.symbol,
          side: t.entry_quantity > 0 ? 'BUY' as const : 'SELL' as const,
          entryPrice: t.entry_price,
          quantity: Math.abs(t.entry_quantity),
          stopLoss: t.stop_loss_price,
          takeProfit: t.take_profit_targets?.[0]?.price ?? null,
          status: t.status,
        }));
      setOrders(filtered);
      setLoadingState('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load orders';
      setError(message);
      setLoadingState('error');
    }
  }, [market]);

  // Initial fetch and polling
  useEffect(() => {
    fetchOrders();
    // Poll every 10 seconds
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleCancelOrder = useCallback(async (orderId: string) => {
    const userId = localStorage.getItem('user_id');
    if (!userId) return;

    setCancellingId(orderId);

    try {
      await cancelTrade(orderId, userId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      toast.success('Trade cancelled');
      onOrderCancelled?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel trade';
      toast.error(message);
    } finally {
      setCancellingId(null);
    }
  }, [onOrderCancelled]);

  const sortedOrders = useMemo(() => {
    return [...orders]; // TradeGroups don't have createdAt, keep API order
  }, [orders]);

  if (loadingState === 'idle') {
    return null;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Mini Header with count and refresh */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-container-border">
        <div className="flex items-center gap-2">
          {orders.length > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-imperial tracking-wider uppercase bg-steel-primary/20 text-steel-primary">
              {orders.length} open
            </span>
          )}
        </div>
        <button
          onClick={fetchOrders}
          className="text-text-secondary hover:text-steel-primary transition-colors p-1"
          aria-label="Refresh orders"
        >
          <RefreshIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto thin-scroll">
        {loadingState === 'loading' && orders.length === 0 ? (
          <OrdersSkeleton />
        ) : loadingState === 'error' ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <span className="text-xs text-negative-red mb-2">{error}</span>
            <button
              onClick={fetchOrders}
              className="text-[10px] text-steel-primary hover:text-steel-bright transition-colors font-imperial tracking-wider uppercase"
            >
              Try again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex items-center justify-center h-full p-4">
            <span className="text-[10px] text-text-secondary font-imperial tracking-wider uppercase">No open orders</span>
          </div>
        ) : (
          <div className="divide-y divide-container-border">
            {sortedOrders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                onCancel={handleCancelOrder}
                isCancelling={cancellingId === order.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface OrderRowProps {
  order: TradeDisplay;
  onCancel: (orderId: string) => void;
  isCancelling: boolean;
}

function OrderRow({ order, onCancel, isCancelling }: OrderRowProps) {
  const { base, quote } = parseMarketSymbol(order.market);
  const isBuy = order.side === 'BUY';

  return (
    <div className="p-3 hover:bg-container-bg-hover/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Side + Market + Status */}
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-imperial font-semibold tracking-wider px-1.5 py-0.5 uppercase ${
              isBuy ? 'bg-positive-green/20 text-positive-green' : 'bg-negative-red/20 text-negative-red'
            }`}>
              {isBuy ? 'LONG' : 'SHORT'}
            </span>
            <span className="text-[10px] text-text-secondary font-imperial tracking-wider">
              {base}/{quote}
            </span>
            <span className={`text-[10px] font-imperial tracking-wider px-1 py-0.5 ${
              order.status === 'Active' ? 'text-positive-green' : 'text-steel-primary'
            }`}>
              {order.status}
            </span>
          </div>

          {/* Entry / SL / TP */}
          <div className="flex items-baseline gap-3 text-xs">
            <div>
              <span className="text-text-secondary font-imperial text-[9px] tracking-wider uppercase">Entry: </span>
              <span className="font-numeral text-text-default">
                {order.entryPrice != null ? Number(order.entryPrice).toFixed(2) : 'Pending'}
              </span>
            </div>
            {order.stopLoss != null && (
              <div>
                <span className="text-negative-red font-imperial text-[9px] tracking-wider uppercase">SL: </span>
                <span className="font-numeral text-negative-red">{Number(order.stopLoss).toFixed(2)}</span>
              </div>
            )}
            {order.takeProfit != null && (
              <div>
                <span className="text-positive-green font-imperial text-[9px] tracking-wider uppercase">TP: </span>
                <span className="font-numeral text-positive-green">{Number(order.takeProfit).toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Quantity */}
          <div className="mt-1">
            <span className="text-text-secondary font-imperial text-[9px] tracking-wider uppercase">Size: </span>
            <span className="font-numeral text-text-default text-xs">{order.quantity}</span>
          </div>
        </div>

        {/* Cancel Button */}
        <button
          onClick={() => onCancel(order.id)}
          disabled={isCancelling}
          className="flex-shrink-0 p-1.5 text-text-secondary hover:text-negative-red hover:bg-negative-red/10
                   rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Cancel trade"
        >
          {isCancelling ? <LoadingSpinner className="w-4 h-4" /> : <CloseIcon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="divide-y divide-container-border">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton variant="rectangular" width={40} height={18} />
            <Skeleton variant="text" width={60} height={12} />
          </div>
          <div className="flex gap-3">
            <Skeleton variant="text" width={80} height={14} />
            <Skeleton variant="text" width={60} height={14} />
          </div>
        </div>
      ))}
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

function CloseIcon({ className }: { className?: string }) {
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default OpenOrders;
