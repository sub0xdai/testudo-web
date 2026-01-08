import { useEffect, useContext, useMemo } from "react";
import { getTicker } from "../utils/requests";
import { TradesContext } from "../state/TradesProvider";
import { formatUSD, formatCompact, formatPercentChange, parseMarketSymbol } from "../utils/format";
import { Skeleton, StatSkeleton } from "./ui/Skeleton";

interface MarketBarProps {
  market: string;
}

export const MarketBar = ({ market }: MarketBarProps) => {
  const { ticker, setTicker, setStats, price, loading, setLoading, setError } =
    useContext(TradesContext);

  const { base, quote } = useMemo(() => parseMarketSymbol(market), [market]);

  // Fetch ticker on mount and market change
  useEffect(() => {
    let mounted = true;

    const fetchTicker = async () => {
      try {
        setLoading('ticker', true);
        const data = await getTicker(market);
        if (mounted) {
          setTicker(data);
          setError('ticker', null);
        }
      } catch (err) {
        if (mounted) {
          setError('ticker', 'Failed to load market data');
        }
      } finally {
        if (mounted) {
          setLoading('ticker', false);
        }
      }
    };

    fetchTicker();
    return () => { mounted = false; };
  }, [market, setTicker, setLoading, setError]);

  // Update stats when ticker changes
  useEffect(() => {
    if (ticker) {
      setStats([
        { label: "24h Volume", value: formatCompact(ticker.volume) },
        { label: "24h High", value: formatUSD(ticker.high) },
        { label: "24h Low", value: formatUSD(ticker.low) },
      ]);
    }
  }, [ticker, setStats]);

  const priceChange = useMemo(() => {
    return formatPercentChange(ticker?.priceChange);
  }, [ticker?.priceChange]);

  const displayPrice = useMemo(() => {
    return formatUSD(price);
  }, [price]);

  const isTickerLoading = loading.ticker;

  return (
    <div className="inline-flex items-center justify-center w-full h-full thin-scroll">
      {/* Market Pair Section */}
      <div className="h-full bg-container-bg overflow-hidden flex flex-col justify-center w-[308px] min-w-[100px] rounded-l-xl border border-container-border">
        <div className="z-40 h-full flex flex-row w-full items-center justify-center gap-2 bg-container-bg text-text-default relative hover:bg-container-bg-hover transition-colors duration-150 sm:p-2">
          <div className="flex items-center justify-center">
            <div>
              <img
                src={`/${base.toLowerCase()}.svg`}
                alt={base}
                className="rounded-full relative z-10"
                width={28}
                height={28}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/default-token.svg';
                }}
              />
            </div>
            <div className="-ml-[20%]">
              <img
                src={`/${quote.toLowerCase()}.svg`}
                alt={quote}
                className="rounded-full"
                width={24}
                height={24}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/default-token.svg';
                }}
              />
            </div>
          </div>
          <span className="text-text-default hidden md:block text-[18px] font-semibold">
            {base}/{quote}
          </span>
        </div>
      </div>

      {/* Price and Stats Section */}
      <div className="relative flex items-center justify-start w-full border border-l-0 border-container-border bg-container-bg h-full hidden-scroll sm:thin-scroll rounded-r-xl">
        <div className="flex justify-between sm:justify-start font-display whitespace-nowrap">
          <div className="flex flex-row items-center justify-between px-4 py-2 space-x-3 xl:space-x-4 xl:px-6 sm:py-0">
            {/* Connection Indicator */}
            <div className="outline-none focus:outline-none flex">
              <div className="flex flex-col">
                <div className="block h-2 w-2 rounded-full bg-positive-green animate-pulse" />
              </div>
            </div>

            {/* Price Display */}
            <div className="outline-none focus:outline-none flex mr-0 sm:mr-0">
              <div className="flex flex-col">
                <div className="overflow-hidden text-lg text-text-default font-numeral">
                  {isTickerLoading && !price ? (
                    <Skeleton variant="text" width={80} height={24} />
                  ) : (
                    <span className="text-[18px] leading-[-0.25px]">
                      <span className="whitespace-nowrap">{displayPrice}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Price Change */}
            <div className="outline-none focus:outline-none flex mr-20 sm:mr-0">
              <div className="flex flex-col left-10">
                <div className="block overflow-hidden">
                  {isTickerLoading ? (
                    <Skeleton variant="text" width={50} height={16} />
                  ) : (
                    <span className="font-semibold text-[13px] leading-[16px]">
                      <span
                        className={`flex items-center transition-colors duration-150 ${
                          priceChange.isPositive
                            ? 'text-positive-green'
                            : priceChange.isNegative
                            ? 'text-negative-red'
                            : 'text-text-secondary'
                        }`}
                      >
                        {priceChange.text}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        {isTickerLoading ? (
          <>
            <div className="px-2 xl:px-6 hidden md:flex">
              <StatSkeleton />
            </div>
            <div className="px-2 xl:px-6 hidden md:flex">
              <StatSkeleton />
            </div>
            <div className="px-2 xl:px-6 hidden md:flex">
              <StatSkeleton />
            </div>
          </>
        ) : (
          <>
            <StatItem label="24h Volume" value={formatCompact(ticker?.volume)} />
            <StatItem label="24h High" value={formatUSD(ticker?.high)} />
            <StatItem label="24h Low" value={formatUSD(ticker?.low)} />
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Stat item component for cleaner rendering
 */
function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 xl:px-6 hidden md:flex flex-col justify-center">
      <div className="flex flex-col">
        <span className="text-[11px] leading-[12px] tracking-[.15px] text-text-secondary">
          {label}
        </span>
        <span className="font-semibold text-[13px] leading-[16px] text-text-default mt-0.5">
          {value}
        </span>
      </div>
    </div>
  );
}
