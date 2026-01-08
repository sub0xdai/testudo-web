import { useCallback, useEffect, useRef, useState, useContext, useMemo } from "react";
import { ChartManager } from "../../utils/chart_manager";
import { getKlines } from "../../utils/requests";
import { KLine } from "../../utils/types";
import { TradesContext } from "../../state/TradesProvider";
import { parseMarketSymbol } from "../../utils/format";

type TimeInterval = '1min' | '5min' | '15min' | '1h' | '4h' | '1d' | '1w';

interface TimeOption {
  label: string;
  value: TimeInterval;
}

const TIME_OPTIONS: TimeOption[] = [
  { label: "1m", value: "1min" },
  { label: "5m", value: "5min" },
  { label: "15m", value: "15min" },
  { label: "1H", value: "1h" },
  { label: "4H", value: "4h" },
  { label: "1D", value: "1d" },
  { label: "1W", value: "1w" },
];

interface TradeViewProps {
  market: string;
}

/**
 * Chart loading skeleton
 */
function ChartSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-container-bg">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-interactive-link border-t-transparent rounded-full animate-spin" />
        <span className="text-text-secondary text-sm">Loading chart...</span>
      </div>
    </div>
  );
}

/**
 * Error state for chart
 */
function ChartError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-container-bg">
      <div className="flex flex-col items-center gap-3 text-center px-4">
        <svg className="w-8 h-8 text-negative-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="text-text-secondary text-sm">{message}</span>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-container-bg-hover text-text-default text-sm rounded-lg
                   hover:bg-container-bg-selected transition-colors duration-150
                   focus:outline-none focus:ring-2 focus:ring-interactive-link/50"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

/**
 * Empty state when no data
 */
function ChartEmpty() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-container-bg">
      <div className="flex flex-col items-center gap-2 text-center">
        <svg className="w-8 h-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-text-secondary text-sm">No chart data available</span>
      </div>
    </div>
  );
}

export const TradeView = ({ market }: TradeViewProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartManagerRef = useRef<ChartManager | null>(null);

  const { setLoading, setError } = useContext(TradesContext);

  const [selectedTime, setSelectedTime] = useState<TimeInterval>("1h");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setLocalError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  const { base, quote } = useMemo(() => parseMarketSymbol(market), [market]);

  const fetchKlineData = useCallback(
    async (interval: TimeInterval) => {
      setIsLoading(true);
      setLocalError(null);
      setLoading('chart', true);

      try {
        const startTime = Math.floor(
          (Date.now() - 1000 * 60 * 60 * 24 * 7) / 1000 // Last week
        );

        const klineData = await getKlines(market, interval, startTime);

        if (!chartRef.current) return;

        // Destroy existing chart
        if (chartManagerRef.current) {
          chartManagerRef.current.destroy();
          chartManagerRef.current = null;
        }

        if (klineData.length === 0) {
          setHasData(false);
          return;
        }

        setHasData(true);

        // Transform and sort data
        const cleanedKlineData = klineData
          .map((x: KLine) => ({
            close: parseFloat(x.close),
            high: parseFloat(x.high),
            low: parseFloat(x.low),
            open: parseFloat(x.open),
            timestamp: new Date(x.end),
          }))
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        // Initialize new chart
        chartManagerRef.current = new ChartManager(
          chartRef.current,
          cleanedKlineData,
          {
            background: "#121212",
            color: "white",
          }
        );

        setError('chart', null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load chart data";
        setLocalError(errorMessage);
        setError('chart', errorMessage);
        setHasData(false);
      } finally {
        setIsLoading(false);
        setLoading('chart', false);
      }
    },
    [market, setLoading, setError]
  );

  useEffect(() => {
    fetchKlineData(selectedTime);

    return () => {
      if (chartManagerRef.current) {
        chartManagerRef.current.destroy();
        chartManagerRef.current = null;
      }
    };
  }, [fetchKlineData, selectedTime]);

  const handleRetry = useCallback(() => {
    fetchKlineData(selectedTime);
  }, [fetchKlineData, selectedTime]);

  return (
    <div className="h-full bg-container-bg border-container-border rounded-xl border overflow-hidden flex flex-col">
      {/* Header */}
      <div className="w-full py-2 px-3 flex items-center justify-between border-b border-container-border">
        {/* Market Pair */}
        <div className="text-text-emphasis text-sm font-semibold">
          {base} / {quote}
        </div>

        {/* Time Interval Selector */}
        <div className="flex items-center gap-1">
          <span className="text-text-secondary text-xs mr-2">Interval</span>
          {TIME_OPTIONS.map((option) => (
            <TimeButton
              key={option.value}
              label={option.label}
              isSelected={selectedTime === option.value}
              onClick={() => setSelectedTime(option.value)}
            />
          ))}
        </div>

        {/* Chart Type Indicator */}
        <div className="text-text-secondary text-xs">
          TradingView
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 relative min-h-[300px]">
        {isLoading ? (
          <ChartSkeleton />
        ) : error ? (
          <ChartError message={error} onRetry={handleRetry} />
        ) : !hasData ? (
          <ChartEmpty />
        ) : (
          <div ref={chartRef} className="w-full h-full" />
        )}
      </div>
    </div>
  );
};

/**
 * Time interval button component
 */
function TimeButton({
  label,
  isSelected,
  onClick,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-2 py-1 text-xs rounded transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-interactive-link/50
        ${isSelected
          ? "bg-container-bg-selected text-text-emphasis font-semibold"
          : "text-text-secondary hover:text-text-default hover:bg-container-bg-hover"
        }
      `}
    >
      {label}
    </button>
  );
}
