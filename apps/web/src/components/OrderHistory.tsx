import { useState, useEffect, useCallback, useMemo } from 'react';
import { OrderHistory as OrderHistoryType } from '../utils/types';
import { getOrderHistory } from '../utils/requests';
import { formatPrice, formatQuantity, formatTime, parseMarketSymbol } from '../utils/format';
import { Skeleton } from './ui/Skeleton';

interface OrderHistoryProps {
  market: string;
}

type LoadingState = 'idle' | 'loading' | 'success' | 'error';
type FilterStatus = 'all' | 'FILLED' | 'CANCELLED';

/**
 * Displays user's order history (completed and cancelled orders)
 */
export function OrderHistory({ market }: OrderHistoryProps) {
  const [orders, setOrders] = useState<OrderHistoryType[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const fetchOrders = useCallback(async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      setLoadingState('idle');
      return;
    }

    setLoadingState('loading');
    setError(null);

    try {
      const data = await getOrderHistory(userId, market);
      setOrders(data);
      setLoadingState('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load order history';
      setError(message);
      setLoadingState('error');
    }
  }, [market]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(o => o.status === filterStatus);
    }

    // Sort by completion time (most recent first)
    return result.sort((a, b) => b.completedAt - a.completedAt);
  }, [orders, filterStatus]);

  // Group orders by date for better organization
  const groupedOrders = useMemo(() => {
    const groups = new Map<string, OrderHistoryType[]>();

    filteredOrders.forEach(order => {
      const date = new Date(order.completedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date)!.push(order);
    });

    return groups;
  }, [filteredOrders]);

  if (loadingState === 'idle') {
    return null;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Mini Header with filters and refresh */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-container-border">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1">
          <FilterTab
            label="All"
            isActive={filterStatus === 'all'}
            onClick={() => setFilterStatus('all')}
            count={orders.length}
          />
          <FilterTab
            label="Filled"
            isActive={filterStatus === 'FILLED'}
            onClick={() => setFilterStatus('FILLED')}
            count={orders.filter(o => o.status === 'FILLED').length}
          />
          <FilterTab
            label="Cancelled"
            isActive={filterStatus === 'CANCELLED'}
            onClick={() => setFilterStatus('CANCELLED')}
            count={orders.filter(o => o.status === 'CANCELLED').length}
          />
        </div>
        <button
          onClick={fetchOrders}
          className="text-text-secondary hover:text-steel-primary transition-colors p-1"
          aria-label="Refresh history"
        >
          <RefreshIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto thin-scroll">
        {loadingState === 'loading' && orders.length === 0 ? (
          <HistorySkeleton />
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
        ) : filteredOrders.length === 0 ? (
          <div className="flex items-center justify-center h-full p-4">
            <span className="text-[10px] text-text-secondary font-imperial tracking-wider uppercase">
              {filterStatus === 'all' ? 'No order history' : `No ${filterStatus.toLowerCase()} orders`}
            </span>
          </div>
        ) : (
          <div className="divide-y divide-container-border">
            {Array.from(groupedOrders.entries()).map(([date, dateOrders]) => (
              <div key={date}>
                <div className="sticky top-0 px-3 py-1.5 bg-container-bg-hover/50 text-[10px] text-text-secondary font-imperial tracking-wider uppercase">
                  {date}
                </div>
                {dateOrders.map((order) => (
                  <HistoryRow key={order.orderId} order={order} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface FilterTabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  count: number;
}

function FilterTab({ label, isActive, onClick, count }: FilterTabProps) {
  return (
    <button
      onClick={onClick}
      className={`
        px-2 py-1 text-[10px] font-imperial font-semibold tracking-wider uppercase transition-colors
        ${isActive
          ? 'text-text-default border-b-2 border-steel-primary'
          : 'text-text-secondary hover:text-text-default border-b-2 border-transparent'
        }
      `}
    >
      {label}
      {count > 0 && (
        <span className="ml-0.5 text-[9px] font-numeral opacity-70">({count})</span>
      )}
    </button>
  );
}

interface HistoryRowProps {
  order: OrderHistoryType;
}

function HistoryRow({ order }: HistoryRowProps) {
  const { base, quote } = parseMarketSymbol(order.market);
  const isBuy = order.side === 'BUY';
  const isFilled = order.status === 'FILLED';
  const filledPercent = (parseFloat(order.filledQuantity) / parseFloat(order.quantity)) * 100;

  return (
    <div className="p-3 hover:bg-container-bg-hover/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        {/* Order Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-imperial font-semibold tracking-wider px-1.5 py-0.5 uppercase ${
                isBuy
                  ? 'bg-positive-green/20 text-positive-green'
                  : 'bg-negative-red/20 text-negative-red'
              }`}
            >
              {order.side}
            </span>
            <span className="text-[10px] text-text-secondary font-imperial tracking-wider">
              {base}/{quote}
            </span>
            <StatusBadge status={order.status} />
          </div>

          <div className="flex items-baseline gap-4 text-xs">
            <div>
              <span className="text-text-secondary font-imperial text-[9px] tracking-wider uppercase">Price: </span>
              <span className="font-numeral text-text-default">
                {formatPrice(order.price)}
              </span>
            </div>
            <div>
              <span className="text-text-secondary font-imperial text-[9px] tracking-wider uppercase">
                {isFilled ? 'Filled: ' : 'Size: '}
              </span>
              <span className="font-numeral text-text-default">
                {isFilled
                  ? formatQuantity(order.filledQuantity)
                  : `${formatQuantity(order.filledQuantity)}/${formatQuantity(order.quantity)}`
                }
              </span>
            </div>
          </div>

          {/* Partial fill indicator for cancelled orders */}
          {order.status === 'CANCELLED' && filledPercent > 0 && (
            <div className="mt-1.5 text-[10px] text-text-secondary font-numeral">
              Partially filled: {filledPercent.toFixed(1)}%
            </div>
          )}
        </div>

        {/* Completion Time */}
        <div className="text-right">
          <span className="text-[10px] text-text-secondary font-numeral">
            {formatTime(order.completedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderHistoryType['status'] }) {
  const config = {
    FILLED: {
      bg: 'bg-positive-green/10',
      text: 'text-positive-green',
      label: 'Filled',
    },
    CANCELLED: {
      bg: 'bg-steel-dim/10',
      text: 'text-steel-dim',
      label: 'Cancelled',
    },
    EXPIRED: {
      bg: 'bg-text-secondary/10',
      text: 'text-text-secondary',
      label: 'Expired',
    },
  };

  const { bg, text, label } = config[status];

  return (
    <span className={`text-[9px] font-imperial tracking-wider uppercase px-1.5 py-0.5 ${bg} ${text}`}>
      {label}
    </span>
  );
}

function HistorySkeleton() {
  return (
    <div className="divide-y divide-container-border">
      <div className="px-3 py-1.5">
        <Skeleton variant="text" width={80} height={12} />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton variant="rectangular" width={40} height={18} />
            <Skeleton variant="text" width={60} height={12} />
            <Skeleton variant="rectangular" width={50} height={16} />
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

export default OrderHistory;
