import { useCallback, useEffect, useRef, useState, useContext, useMemo } from "react";
import { ChartManager } from "../../utils/chart_manager";
import { getKlines } from "../../utils/requests";
import { KLine } from "../../utils/types";
import { TradesContext } from "../../state/TradesProvider";
import { parseMarketSymbol } from "../../utils/format";
import { BinanceWsManager } from "../../utils/binance_ws";
import { PositionDrawingTool, type PersistedPositionState } from "../chart/PositionDrawingTool";

// Binance-compatible interval values
type TimeInterval = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '12h' | '1d' | '3d' | '1w' | '1M';

interface TimeOption {
  label: string;
  value: TimeInterval;
}

const TIME_OPTIONS: TimeOption[] = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
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
        <div className="w-8 h-8 border-2 border-steel-primary border-t-transparent animate-spin" />
        <span className="text-text-secondary text-[10px] font-imperial tracking-wider uppercase">Loading chart...</span>
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
        <span className="text-text-secondary text-xs">{message}</span>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-container-bg-hover text-text-default text-[10px] font-imperial tracking-wider uppercase
                   hover:bg-container-bg-selected transition-colors duration-150
                   focus:outline-none focus:ring-1 focus:ring-steel-primary/50"
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
        <span className="text-text-secondary text-[10px] font-imperial tracking-wider uppercase">No chart data available</span>
      </div>
    </div>
  );
}

export const TradeView = ({ market }: TradeViewProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartManagerRef = useRef<ChartManager | null>(null);
  const isMountedRef = useRef(true);

  const { setLoading, setError } = useContext(TradesContext);

  const [selectedTime, setSelectedTime] = useState<TimeInterval>("1h");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setLocalError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  // Position tool state - persisted per market
  const positionsByMarket = useRef<Map<string, PersistedPositionState>>(new Map());
  const [, setPositionToolTrigger] = useState(0); // Force re-render on state change

  // Get current market's position state
  const currentPositionState = positionsByMarket.current.get(market);
  const isPositionToolActive = currentPositionState?.drawingState !== undefined &&
                               currentPositionState.drawingState !== 'idle';

  // Handle position state changes from the tool
  const handlePositionStateChange = useCallback((state: PersistedPositionState | null) => {
    if (state === null) {
      positionsByMarket.current.delete(market);
    } else {
      positionsByMarket.current.set(market, state);
    }
    setPositionToolTrigger(n => n + 1); // Trigger re-render
  }, [market]);

  // Activate position tool for current market
  const activatePositionTool = useCallback(() => {
    positionsByMarket.current.set(market, { drawingState: 'ready', levels: null });
    setPositionToolTrigger(n => n + 1);
  }, [market]);

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

        // Check if still mounted before updating state
        if (!isMountedRef.current) {
          return;
        }

        if (!klineData || klineData.length === 0) {
          setHasData(false);
          return;
        }

        // Destroy existing chart
        if (chartManagerRef.current) {
          chartManagerRef.current.destroy();
          chartManagerRef.current = null;
        }

        if (!chartRef.current) {
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
            // Use start time (open time) - standard for financial charts
            timestamp: new Date(parseInt(x.start, 10)),
          }))
          // Filter out invalid dates to prevent chart crashes
          .filter((x) => !isNaN(x.timestamp.getTime()))
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        if (!chartRef.current) {
          return;
        }

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
    isMountedRef.current = true;
    fetchKlineData(selectedTime);

    return () => {
      isMountedRef.current = false;
      if (chartManagerRef.current) {
        chartManagerRef.current.destroy();
        chartManagerRef.current = null;
      }
    };
  }, [fetchKlineData, selectedTime]);

  // Real-time kline updates via WebSocket
  useEffect(() => {
    const ws = BinanceWsManager.getInstance();

    // Subscribe to the market with the selected kline interval
    ws.subscribe(market, selectedTime);

    const unsubKline = ws.onKlineUpdate(`KLINE-${market}-${selectedTime}`, (data) => {
      if (!chartManagerRef.current || !isMountedRef.current) return;

      // Update the chart with the new candle data
      // Convert startTime from milliseconds to seconds for lightweight-charts
      chartManagerRef.current.update({
        open: parseFloat(data.open),
        high: parseFloat(data.high),
        low: parseFloat(data.low),
        close: parseFloat(data.close),
        time: Math.floor(data.startTime / 1000),
        newCandleInitiated: data.isClosed,
      });
    });

    return () => {
      unsubKline();
    };
  }, [market, selectedTime]);

  const handleRetry = useCallback(() => {
    fetchKlineData(selectedTime);
  }, [fetchKlineData, selectedTime]);

  return (
    <div className="h-full bg-container-bg border-container-border border overflow-hidden flex flex-col">
      {/* Header */}
      <div className="w-full py-2 px-3 flex items-center justify-between border-b border-container-border">
        {/* Market Pair */}
        <div className="text-text-emphasis text-xs font-imperial font-semibold tracking-wider">
          {base} / {quote}
        </div>

        {/* Time Interval Selector */}
        <div className="flex items-center gap-1">
          <span className="text-text-secondary text-[9px] font-imperial tracking-wider uppercase mr-2">Interval</span>
          {TIME_OPTIONS.map((option) => (
            <TimeButton
              key={option.value}
              label={option.label}
              isSelected={selectedTime === option.value}
              onClick={() => setSelectedTime(option.value)}
            />
          ))}
        </div>

        {/* Tools */}
        <div className="flex items-center gap-2">
          <PositionToolButton
            isActive={isPositionToolActive}
            onClick={() => {
              if (isPositionToolActive) {
                handlePositionStateChange(null); // Deactivate
              } else {
                activatePositionTool(); // Activate
              }
            }}
          />
          <div className="text-text-secondary text-[9px] font-imperial tracking-wider uppercase">
            TradingView
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 relative min-h-[300px]">
        {/* Chart div ALWAYS rendered so ref exists */}
        <div ref={chartRef} className="w-full h-full" />

        {/* Position Drawing Tool Overlay - keyed by market for clean lifecycle */}
        <PositionDrawingTool
          key={market}
          chartManager={chartManagerRef.current}
          market={market}
          accountBalance={10000}
          isActive={isPositionToolActive}
          initialState={currentPositionState}
          onStateChange={handlePositionStateChange}
          onDeactivate={() => handlePositionStateChange(null)}
        />

        {/* Overlay states on top of chart */}
        {isLoading && (
          <div className="absolute inset-0">
            <ChartSkeleton />
          </div>
        )}
        {!isLoading && error && (
          <div className="absolute inset-0">
            <ChartError message={error} onRetry={handleRetry} />
          </div>
        )}
        {!isLoading && !error && !hasData && (
          <div className="absolute inset-0">
            <ChartEmpty />
          </div>
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
        px-2 py-1 text-[10px] font-numeral transition-all duration-150
        focus:outline-none focus:ring-1 focus:ring-steel-primary/50
        ${isSelected
          ? "bg-container-bg-selected text-text-emphasis font-semibold border-b-2 border-steel-primary"
          : "text-text-secondary hover:text-text-default hover:bg-container-bg-hover border-b-2 border-transparent"
        }
      `}
    >
      {label}
    </button>
  );
}

/**
 * Position Tool toggle button
 * DRAW-05: Toolbar button to activate drawing mode
 */
function PositionToolButton({
  isActive,
  onClick,
}: {
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title="Position Tool - Click to draw entry/SL/TP on chart"
      className={`
        px-2 py-1 rounded transition-all duration-150 flex items-center gap-1.5
        focus:outline-none focus:ring-1 focus:ring-steel-primary/50
        text-[10px] font-imperial font-semibold uppercase tracking-wider
        ${isActive
          ? "bg-steel-primary text-main-bg"
          : "text-text-secondary hover:text-text-default hover:bg-container-bg-hover border border-container-border"
        }
      `}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="6" x2="12" y2="6" strokeDasharray="2 2" />
        <line x1="4" y1="18" x2="12" y2="18" strokeDasharray="2 2" />
        <circle cx="18" cy="6" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
      Position
    </button>
  );
}
