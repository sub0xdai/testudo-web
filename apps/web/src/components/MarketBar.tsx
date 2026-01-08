import { useEffect, useContext, useMemo } from "react";
import { getTicker } from "../utils/requests";
import { TradesContext } from "../state/TradesProvider";
import { formatUSD, formatCompact, formatPercentChange } from "../utils/format";
import { Skeleton, StatSkeleton } from "./ui/Skeleton";
import { MarketSelector } from "./MarketSelector";

interface MarketBarProps {
  market: string;
}

export const MarketBar = ({ market }: MarketBarProps) => {
  const { ticker, setTicker, setStats, price, loading, setLoading, setError } =
    useContext(TradesContext);

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
      {/* Market Selector - Imperial Style */}
      <div className="h-full panel-imperial overflow-hidden flex items-center justify-center min-w-[160px] px-3 border-r border-imperial-gold-dim/30">
        <MarketSelector currentMarket={market} />
      </div>

      {/* Price and Stats Section */}
      <div className="relative flex items-center justify-start w-full panel-imperial h-full hidden-scroll sm:thin-scroll">
        {/* Gold accent line at top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-imperial-gold/30 to-transparent" />

        <div className="flex justify-between sm:justify-start font-display whitespace-nowrap">
          <div className="flex flex-row items-center justify-between px-4 py-2 space-x-4 xl:space-x-5 xl:px-6 sm:py-0">
            {/* Connection Indicator - Gold pulse */}
            <div className="outline-none focus:outline-none flex">
              <div className="flex flex-col">
                <div className="block h-2 w-2 bg-imperial-gold animate-gold-pulse" />
              </div>
            </div>

            {/* Price Display - Large monospace */}
            <div className="outline-none focus:outline-none flex mr-0 sm:mr-0">
              <div className="flex flex-col">
                <div className="overflow-hidden text-xl text-text-emphasis font-numeral tracking-tight">
                  {isTickerLoading && !price ? (
                    <Skeleton variant="text" width={100} height={28} />
                  ) : (
                    <span className="text-[20px] leading-tight">
                      <span className="whitespace-nowrap">{displayPrice}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Price Change - Imperial colors */}
            <div className="outline-none focus:outline-none flex mr-20 sm:mr-0">
              <div className="flex flex-col left-10">
                <div className="block overflow-hidden">
                  {isTickerLoading ? (
                    <Skeleton variant="text" width={50} height={16} />
                  ) : (
                    <span className="font-semibold text-[13px] leading-[16px] font-numeral">
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

        {/* Stats Section - Imperial styling */}
        {isTickerLoading ? (
          <>
            <ImperialStatSkeleton />
            <ImperialStatSkeleton />
            <ImperialStatSkeleton />
          </>
        ) : (
          <>
            <ImperialStatItem label="VOLUME" value={formatCompact(ticker?.volume)} />
            <ImperialStatItem label="HIGH" value={formatUSD(ticker?.high)} />
            <ImperialStatItem label="LOW" value={formatUSD(ticker?.low)} />
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Imperial stat item with gold accent
 */
function ImperialStatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 xl:px-5 hidden md:flex flex-col justify-center border-l border-imperial-gold-dim/20">
      <div className="flex flex-col">
        <span className="text-[9px] leading-[10px] tracking-[.2em] text-imperial-gold-dim font-imperial">
          {label}
        </span>
        <span className="font-semibold text-[14px] leading-[18px] text-text-default mt-0.5 font-numeral">
          {value}
        </span>
      </div>
    </div>
  );
}

/**
 * Skeleton for imperial stat
 */
function ImperialStatSkeleton() {
  return (
    <div className="px-3 xl:px-5 hidden md:flex flex-col justify-center border-l border-imperial-gold-dim/20">
      <StatSkeleton />
    </div>
  );
}
