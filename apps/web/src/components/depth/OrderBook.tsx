import { useContext, useRef, useMemo, useCallback } from "react";
import { TradesContext } from "../../state/TradesProvider";
import { formatPrice, formatQuantity, formatUSD } from "../../utils/format";
import { Skeleton } from "../ui/Skeleton";

interface OrderBookRowProps {
  price: string;
  size: string;
  cumulativeWidth: string;
  sizeWidth: string;
  side: 'bid' | 'ask';
}

/**
 * Individual order book row component for better performance
 */
function OrderBookRow({ price, size, cumulativeWidth, sizeWidth, side }: OrderBookRowProps) {
  const isBid = side === 'bid';
  const priceColor = isBid ? 'text-positive-green' : 'text-negative-red';
  const bgColor = isBid ? 'bg-positive-green' : 'bg-negative-red';
  // Stoic aesthetic: subtle depth, numbers primary
  const bgColorCumulative = isBid ? 'bg-positive-green/[0.08]' : 'bg-negative-red/[0.08]';
  const sideLabel = isBid ? 'Buy' : 'Sell';

  return (
    <div
      className="relative w-full group"
      role="listitem"
      aria-label={`${sideLabel} ${size} at ${price}`}
    >
      <div className="w-full h-[22px] flex relative box-border text-xs leading-7 justify-between font-display">
        <div className="flex flex-row mx-2 justify-between font-numeral w-full">
          <div className={`z-10 text-xs leading-6 ${priceColor}`}>
            {formatPrice(price)}
          </div>
          <div className="z-10 text-xs leading-6 text-text-default">
            {formatQuantity(size)}
          </div>
        </div>
        {/* Cumulative background - subtle 8% */}
        <div className="absolute w-full h-full flex justify-end pointer-events-none">
          <div
            className={`${bgColorCumulative} h-full transition-all duration-200 ease-out`}
            style={{ width: cumulativeWidth }}
          />
        </div>
        {/* Size-based background - subtle 12% */}
        <div className="absolute w-full h-full flex justify-end pointer-events-none">
          <div
            className={`${bgColor} opacity-[0.12] h-full transition-all duration-200 ease-out`}
            style={{ width: sizeWidth }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for order book
 */
function OrderBookSkeleton() {
  return (
    <div className="flex flex-col gap-0.5 px-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex justify-between py-1">
          <Skeleton variant="text" width={70} height={14} />
          <Skeleton variant="text" width={50} height={14} />
        </div>
      ))}
    </div>
  );
}

export const OrderBook = () => {
  const { bids, asks, price, totalBidSize, totalAskSize, loading } =
    useContext(TradesContext);

  const bidsRef = useRef<HTMLDivElement | null>(null);
  const asksRef = useRef<HTMLDivElement | null>(null);

  // Calculate width percentages
  const calculateWidth = useCallback((size: string, totalSize: number): string => {
    if (!totalSize) return "0%";
    const percentage = (parseFloat(size) * 100) / totalSize;
    return `${Math.min(percentage, 100)}%`;
  }, []);

  // Pre-calculate cumulative widths for bids (memoized)
  const bidsWithCumulative = useMemo(() => {
    if (!bids?.length) return [];

    let cumulative = 0;
    return bids.map(([orderPrice, orderSize]) => {
      const size = parseFloat(orderSize);
      cumulative += size;
      return {
        price: orderPrice,
        size: orderSize,
        cumulativeWidth: totalBidSize > 0 ? `${(cumulative * 100) / totalBidSize}%` : '0%',
        sizeWidth: calculateWidth(orderSize, totalBidSize),
      };
    });
  }, [bids, totalBidSize, calculateWidth]);

  // Pre-calculate cumulative widths for asks (memoized)
  const asksWithCumulative = useMemo(() => {
    if (!asks?.length) return [];

    let cumulative = 0;
    return asks.map(([orderPrice, orderSize]) => {
      const size = parseFloat(orderSize);
      cumulative += size;
      return {
        price: orderPrice,
        size: orderSize,
        cumulativeWidth: totalAskSize > 0 ? `${(cumulative * 100) / totalAskSize}%` : '0%',
        sizeWidth: calculateWidth(orderSize, totalAskSize),
      };
    });
  }, [asks, totalAskSize, calculateWidth]);

  const handleRecenter = useCallback(() => {
    if (bidsRef.current) {
      bidsRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (asksRef.current) {
      asksRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const isLoading = loading.orderBook;
  const hasData = bidsWithCumulative.length > 0 || asksWithCumulative.length > 0;

  return (
    <div className="h-full" role="region" aria-label="Order book">
      <div className="relative h-full bg-container-bg">
        <div className="flex flex-col h-full text-text-label bg-container-bg xs:min-h-[25vh] md:min-h-0">
          {/* Header */}
          <div
            className="flex justify-between text-xs px-2 py-1.5 text-text-secondary border-b border-container-border"
            role="row"
            aria-label="Order book column headers"
          >
            <span className="font-imperial font-semibold text-[10px] leading-[12px] tracking-[0.1em] uppercase" role="columnheader">
              Price
            </span>
            <span className="font-imperial font-semibold text-[10px] leading-[12px] tracking-[0.1em] uppercase" role="columnheader">
              Size
            </span>
          </div>

          <div className="flex-1 flex flex-col-reverse relative overflow-hidden">
            {/* Bids Section */}
            <div
              ref={bidsRef}
              className="flex-1 overflow-y-auto flex flex-col gap-0.5"
              role="list"
              aria-label={`Buy orders (${bidsWithCumulative.length} bids)`}
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {isLoading && !hasData ? (
                <OrderBookSkeleton />
              ) : bidsWithCumulative.length === 0 ? (
                <div className="flex items-center justify-center h-full text-text-secondary text-sm">
                  No bids
                </div>
              ) : (
                bidsWithCumulative.map((order, index) => (
                  <OrderBookRow
                    key={`bid-${order.price}-${index}`}
                    price={order.price}
                    size={order.size}
                    cumulativeWidth={order.cumulativeWidth}
                    sizeWidth={order.sizeWidth}
                    side="bid"
                  />
                ))
              )}
            </div>

            {/* Spread / Current Price Row */}
            <div className="relative w-full px-2 inline-flex justify-between items-center min-h-[28px] bg-container-bg-hover/50 text-text-default z-20 border-y border-container-border">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-[14px] leading-[16px] text-text-emphasis font-numeral">
                  {formatUSD(price)}
                </span>
              </div>
              <button
                onClick={handleRecenter}
                className="text-steel-primary hover:text-steel-bright transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-steel-primary/50 px-1"
                aria-label="Re-center order book"
              >
                <span className="font-imperial font-semibold text-[9px] leading-[10px] tracking-[0.1em] uppercase">
                  Re-center
                </span>
              </button>
            </div>

            {/* Asks Section */}
            <div
              ref={asksRef}
              className="flex-1 overflow-y-auto flex flex-col-reverse gap-0.5"
              role="list"
              aria-label={`Sell orders (${asksWithCumulative.length} asks)`}
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {isLoading && !hasData ? (
                <OrderBookSkeleton />
              ) : asksWithCumulative.length === 0 ? (
                <div className="flex items-center justify-center h-full text-text-secondary text-sm">
                  No asks
                </div>
              ) : (
                asksWithCumulative.map((order, index) => (
                  <OrderBookRow
                    key={`ask-${order.price}-${index}`}
                    price={order.price}
                    size={order.size}
                    cumulativeWidth={order.cumulativeWidth}
                    sizeWidth={order.sizeWidth}
                    side="ask"
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
