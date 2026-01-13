import { useState, useCallback, useRef, useEffect } from 'react';
import { ChartManager, type PositionLevels } from '../../utils/chart_manager';

type HandleType = 'entry' | 'stopLoss' | 'takeProfit';

interface PositionHandleOverlayProps {
  chartManager: ChartManager | null;
  levels: PositionLevels;
  onLevelChange: (type: HandleType, price: number) => void;
  onExecute: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  /** Position sizing info for display */
  stats?: {
    quantity: number;
    riskAmount: number;
    riskRewardRatio: number | null;
  };
}

/**
 * V5-11: Lightweight DOM overlay for interactive handles only
 *
 * This component only renders drag handles and the stats panel.
 * Zones and lines are rendered by the canvas primitive (PositionZonePrimitive).
 *
 * Handles re-position on chart pan/zoom by subscribing to crosshair events.
 */
export function PositionHandleOverlay({
  chartManager,
  levels,
  onLevelChange,
  onExecute,
  onCancel,
  isSubmitting = false,
  stats,
}: PositionHandleOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<HandleType | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<HandleType | null>(null);
  const [, forceUpdate] = useState(0);

  // Convert price to Y coordinate
  const getY = useCallback((price: number): number | null => {
    if (!chartManager) return null;
    return chartManager.priceToCoordinate(price);
  }, [chartManager]);

  // V5-13: Subscribe to chart movement to re-position handles
  useEffect(() => {
    if (!chartManager) return;

    // Force re-render on crosshair move to update handle positions
    const unsubscribe = chartManager.subscribeCrosshairMove(() => {
      forceUpdate((n) => n + 1);
    });

    return unsubscribe;
  }, [chartManager]);

  // V5-12: Handle drag events that update primitive via updateLevels()
  useEffect(() => {
    if (!dragging || !chartManager) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();

      const y = e.clientY - rect.top;
      const price = chartManager.coordinateToPrice(y);
      if (price !== null) {
        onLevelChange(dragging, price);
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, chartManager, onLevelChange]);

  const entryY = getY(levels.entry);
  const slY = getY(levels.stopLoss);
  const tpY = getY(levels.takeProfit);

  // Don't render if we can't get coordinates
  if (entryY === null || slY === null || tpY === null) return null;

  const isLong = levels.side === 'long';

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 15 }}
    >
      {/* Control bar - top right */}
      <div className="absolute top-2 right-2 pointer-events-auto">
        <div
          className="flex items-center gap-2 px-2 py-1 rounded text-[11px]"
          style={{ background: 'rgba(30, 34, 45, 0.9)' }}
        >
          <span style={{ color: '#787b86' }}>Adjust levels or execute</span>
          <button
            onClick={onCancel}
            className="px-2 py-0.5 rounded cursor-pointer hover:bg-[#ef5350]/20"
            style={{ color: '#ef5350' }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Entry Handle */}
      <Handle
        y={entryY}
        price={levels.entry}
        label="ENTRY"
        type="entry"
        isDragging={dragging === 'entry'}
        isHovered={hoveredHandle === 'entry'}
        onDragStart={() => setDragging('entry')}
        onHover={(h) => setHoveredHandle(h ? 'entry' : null)}
      />

      {/* Stop Loss Handle */}
      <Handle
        y={slY}
        price={levels.stopLoss}
        label="SL"
        amount={stats ? -stats.riskAmount : undefined}
        type="stopLoss"
        isDragging={dragging === 'stopLoss'}
        isHovered={hoveredHandle === 'stopLoss'}
        onDragStart={() => setDragging('stopLoss')}
        onHover={(h) => setHoveredHandle(h ? 'stopLoss' : null)}
      />

      {/* Take Profit Handle */}
      <Handle
        y={tpY}
        price={levels.takeProfit}
        label="TP"
        amount={stats?.riskRewardRatio ? stats.riskAmount * stats.riskRewardRatio : undefined}
        type="takeProfit"
        isDragging={dragging === 'takeProfit'}
        isHovered={hoveredHandle === 'takeProfit'}
        onDragStart={() => setDragging('takeProfit')}
        onHover={(h) => setHoveredHandle(h ? 'takeProfit' : null)}
      />

      {/* Stats Panel - positioned near entry */}
      {stats && (
        <div
          className="absolute pointer-events-auto"
          style={{
            right: 60,
            top: isLong
              ? Math.min(entryY, tpY) + 8
              : Math.min(entryY, slY) + 8,
          }}
        >
          <div
            className="flex items-center gap-3 px-3 py-1.5 rounded text-xs"
            style={{
              background: 'rgba(30, 34, 45, 0.95)',
              border: `1px solid ${isLong ? '#26a69a' : '#ef5350'}`,
            }}
          >
            <span style={{ color: '#787b86' }}>
              <span className="text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {stats.quantity.toFixed(2)}
              </span>
              {' '}qty
            </span>
            <span style={{ color: '#ef5350', fontVariantNumeric: 'tabular-nums' }}>
              -${stats.riskAmount.toFixed(0)}
            </span>
            {stats.riskRewardRatio !== null && (
              <span style={{ color: '#26a69a', fontVariantNumeric: 'tabular-nums' }}>
                {stats.riskRewardRatio.toFixed(1)}R
              </span>
            )}
            <button
              onClick={onExecute}
              disabled={isSubmitting}
              className="px-2 py-0.5 text-xs font-bold rounded cursor-pointer transition-opacity disabled:opacity-50"
              style={{
                background: isLong ? '#26a69a' : '#ef5350',
                color: '#000',
              }}
            >
              {isSubmitting ? '...' : isLong ? 'LONG' : 'SHORT'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Handle component - draggable price level indicator
 */
function Handle({
  y,
  price,
  label,
  amount,
  type,
  isDragging,
  isHovered,
  onDragStart,
  onHover,
}: {
  y: number;
  price: number;
  label: string;
  amount?: number;
  type: HandleType;
  isDragging: boolean;
  isHovered: boolean;
  onDragStart: () => void;
  onHover: (hovered: boolean) => void;
}) {
  const colors = {
    entry: { bg: '#ffffff', text: '#000000' },
    stopLoss: { bg: '#ef5350', text: '#000000' },
    takeProfit: { bg: '#26a69a', text: '#000000' },
  };

  const { bg, text } = colors[type];

  return (
    <div
      className="absolute right-0 flex items-center justify-end pointer-events-auto"
      style={{ top: y - 10, right: 0 }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          onDragStart();
        }}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm select-none cursor-ns-resize"
        style={{
          backgroundColor: bg,
          opacity: isDragging || isHovered ? 1 : 0.9,
          transform: isDragging ? 'scale(1.05)' : 'none',
          transition: 'transform 0.1s',
        }}
      >
        <span className="text-[10px] font-bold" style={{ color: text }}>
          {label}
        </span>
        <span
          className="text-[10px]"
          style={{ color: text, fontVariantNumeric: 'tabular-nums' }}
        >
          {price.toFixed(2)}
        </span>
        {amount !== undefined && (
          <span
            className="text-[9px]"
            style={{ color: text, opacity: 0.8, fontVariantNumeric: 'tabular-nums' }}
          >
            {amount >= 0 ? '+' : ''}{amount.toFixed(0)}
          </span>
        )}
      </div>
    </div>
  );
}

export default PositionHandleOverlay;
