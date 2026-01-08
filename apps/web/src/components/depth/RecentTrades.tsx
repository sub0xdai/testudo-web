import { useContext, useMemo } from "react";
import { TradesContext } from "../../state/TradesProvider";
import { formatPrice, formatQuantity, formatTime } from "../../utils/format";
import { Skeleton } from "../ui/Skeleton";

/**
 * Loading skeleton for trades list
 */
function TradesSkeleton() {
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="grid grid-cols-3 gap-4 py-2 px-1">
          <Skeleton variant="text" width="80%" height={14} />
          <Skeleton variant="text" width="60%" height={14} className="mx-auto" />
          <Skeleton variant="text" width="70%" height={14} className="ml-auto" />
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state when no trades
 */
function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full text-text-secondary text-sm">
      No recent trades
    </div>
  );
}

export const RecentTrades = () => {
  const { trades, loading } = useContext(TradesContext);

  const isLoading = loading.trades;
  const isEmpty = !isLoading && trades.length === 0;

  // Memoize formatted trades for performance
  const formattedTrades = useMemo(() => {
    return trades.map((trade) => ({
      ...trade,
      formattedPrice: formatPrice(trade.price),
      formattedQuantity: formatQuantity(trade.quantity),
      formattedTime: formatTime(trade.timestamp),
    }));
  }, [trades]);

  return (
    <div className="h-full flex flex-col bg-container-bg">
      {/* Header */}
      <div className="grid grid-cols-3 gap-4 py-2 px-3 border-b border-container-border text-text-secondary">
        <span className="font-semibold text-[11px] leading-[14px] tracking-[0.15px] text-left uppercase">
          Price
        </span>
        <span className="font-semibold text-[11px] leading-[14px] tracking-[0.15px] text-center uppercase">
          Size
        </span>
        <span className="font-semibold text-[11px] leading-[14px] tracking-[0.15px] text-right uppercase">
          Time
        </span>
      </div>

      {/* Trades List */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {isLoading ? (
          <TradesSkeleton />
        ) : isEmpty ? (
          <EmptyState />
        ) : (
          formattedTrades.map((trade, index) => (
            <div
              key={`${trade.id}-${index}`}
              className="grid grid-cols-3 gap-4 py-1.5 px-3 text-text-default
                       hover:bg-container-bg-hover transition-colors duration-100
                       border-b border-container-border/30 last:border-b-0"
            >
              {/* Price - colored based on trade direction */}
              <span
                className={`font-numeral text-[12px] leading-[16px] text-left font-medium ${
                  trade.isBuyerMaker
                    ? "text-positive-green"
                    : "text-negative-red"
                }`}
              >
                {trade.formattedPrice}
              </span>

              {/* Quantity */}
              <span className="font-numeral text-[12px] leading-[16px] text-center text-text-default">
                {trade.formattedQuantity}
              </span>

              {/* Time */}
              <span className="font-numeral text-[12px] leading-[16px] text-right text-text-secondary whitespace-nowrap">
                {trade.formattedTime}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
