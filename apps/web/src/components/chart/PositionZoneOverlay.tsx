import { useState, useCallback, useRef, useEffect } from 'react';
import { ChartManager } from '../../utils/chart_manager';
import { RiskCalculationResult } from '../../hooks/useRiskCalculation';
import { DrawingState, PositionLevels } from './PositionDrawingTool';

interface PositionZoneOverlayProps {
  chartManager: ChartManager | null;
  levels: PositionLevels;
  previewPrice: number | null;
  drawingState: DrawingState;
  calculation: RiskCalculationResult;
  side: 'LONG' | 'SHORT';
  isSubmitting: boolean;
  onExecute: () => void;
  onCancel: () => void;
  onLevelChange: (type: 'entry' | 'stopLoss' | 'takeProfit', price: number) => void;
}

/**
 * PositionZoneOverlay - Visual overlay showing profit/loss zones
 *
 * DRAW-03: Renders colored zones for profit (green) and loss (red)
 * DRAW-06: Provides draggable handles for adjusting levels
 */
export function PositionZoneOverlay({
  chartManager,
  levels,
  previewPrice,
  drawingState,
  calculation,
  side,
  isSubmitting,
  onExecute,
  onCancel,
  onLevelChange,
}: PositionZoneOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'entry' | 'stopLoss' | 'takeProfit' | 'leftEdge' | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<'entry' | 'stopLoss' | 'takeProfit' | null>(null);
  const [zoneLeftX, setZoneLeftX] = useState(100); // Left edge X position in pixels

  // Convert prices to Y coordinates
  const getY = useCallback((price: number | null): number | null => {
    if (!chartManager || price === null) return null;
    return chartManager.priceToCoordinate(price);
  }, [chartManager]);

  const entryY = getY(levels.entryPrice);
  const slY = getY(levels.stopLossPrice);
  const tpY = getY(levels.takeProfitPrice);
  const previewY = getY(previewPrice);

  // Handle drag for price levels and zone width
  useEffect(() => {
    if (!dragging || !chartManager) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();

      if (dragging === 'leftEdge') {
        // Drag left edge to adjust zone width
        const x = Math.max(20, Math.min(e.clientX - rect.left, rect.width - 100));
        setZoneLeftX(x);
      } else {
        // Drag price level
        const y = e.clientY - rect.top;
        const price = chartManager.coordinateToPrice(y);
        if (price !== null) {
          onLevelChange(dragging, price);
        }
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

  // Get instruction text based on state
  const getInstructionText = () => {
    switch (drawingState) {
      case 'ready':
        return 'Click and drag to draw position';
      case 'dragging':
        return 'Release to set stop loss';
      case 'complete':
        return 'Adjust levels or execute order';
      default:
        return '';
    }
  };

  const isLong = side === 'LONG';

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    >
      {/* Minimal Control Bar - top right */}
      {drawingState !== 'idle' && (
        <div className="absolute top-2 right-2 pointer-events-auto">
          <div
            className="flex items-center gap-2 px-2 py-1 rounded text-[11px]"
            style={{ background: 'rgba(30, 34, 45, 0.9)' }}
          >
            <span style={{ color: '#787b86' }}>{getInstructionText()}</span>
            <button
              onClick={onCancel}
              className="px-2 py-0.5 rounded cursor-pointer hover:bg-[#ef5350]/20"
              style={{ color: '#ef5350' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Preview line while in ready state */}
      {previewY !== null && drawingState === 'ready' && (
        <div
          className="absolute left-0 right-0 border-t border-dashed border-text-secondary/50"
          style={{ top: previewY }}
        />
      )}

      {/* Profit Zone - extends from left edge to right */}
      {entryY !== null && tpY !== null && drawingState === 'complete' && (
        <div
          className="absolute"
          style={{
            left: zoneLeftX,
            right: 0,
            top: Math.min(entryY, tpY),
            height: Math.abs(tpY - entryY),
            backgroundColor: 'rgba(38, 166, 154, 0.25)',
          }}
        />
      )}

      {/* Loss Zone - extends from left edge to right */}
      {entryY !== null && slY !== null && (drawingState === 'dragging' || drawingState === 'complete') && (
        <div
          className="absolute"
          style={{
            left: zoneLeftX,
            right: 0,
            top: Math.min(entryY, slY),
            height: Math.max(Math.abs(slY - entryY), 4),
            backgroundColor: 'rgba(239, 83, 80, 0.25)',
          }}
        />
      )}

      {/* Draggable Left Edge - vertical bar */}
      {(drawingState === 'dragging' || drawingState === 'complete') && entryY !== null && slY !== null && (
        <div
          className="absolute pointer-events-auto cursor-ew-resize"
          style={{
            left: zoneLeftX - 3,
            width: 6,
            top: Math.min(entryY, tpY ?? slY),
            height: Math.abs((tpY ?? slY) - entryY) + Math.abs(slY - entryY),
            background: dragging === 'leftEdge' ? 'rgba(255,255,255,0.3)' : 'transparent',
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            setDragging('leftEdge');
          }}
        >
          {/* Visual indicator line */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-0.5 h-full"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          />
        </div>
      )}

      {/* Entry Line with Handle - shows during dragging and complete */}
      {entryY !== null && levels.entryPrice !== null && (drawingState === 'dragging' || drawingState === 'complete') && (
        <DraggableHandle
          y={entryY}
          price={levels.entryPrice}
          label="ENTRY"
          type="entry"
          leftX={zoneLeftX}
          onDragStart={() => drawingState === 'complete' && setDragging('entry')}
          isDragging={dragging === 'entry'}
          isHovered={hoveredHandle === 'entry'}
          onHover={(h) => setHoveredHandle(h ? 'entry' : null)}
          interactive={drawingState === 'complete'}
        />
      )}

      {/* Stop Loss Line with Handle - shows during dragging and complete */}
      {slY !== null && levels.stopLossPrice !== null && (drawingState === 'dragging' || drawingState === 'complete') && (
        <DraggableHandle
          y={slY}
          price={levels.stopLossPrice}
          label="SL"
          amount={calculation.isValid ? -calculation.riskAmount : undefined}
          type="stopLoss"
          leftX={zoneLeftX}
          onDragStart={() => drawingState === 'complete' && setDragging('stopLoss')}
          isDragging={dragging === 'stopLoss'}
          isHovered={hoveredHandle === 'stopLoss'}
          onHover={(h) => setHoveredHandle(h ? 'stopLoss' : null)}
          interactive={drawingState === 'complete'}
        />
      )}

      {/* Take Profit Line with Handle - only shows when complete */}
      {tpY !== null && levels.takeProfitPrice !== null && drawingState === 'complete' && (
        <DraggableHandle
          y={tpY}
          price={levels.takeProfitPrice}
          label="TP"
          amount={calculation.profitAmount ?? undefined}
          type="takeProfit"
          leftX={zoneLeftX}
          onDragStart={() => setDragging('takeProfit')}
          isDragging={dragging === 'takeProfit'}
          isHovered={hoveredHandle === 'takeProfit'}
          onHover={(h) => setHoveredHandle(h ? 'takeProfit' : null)}
          interactive={true}
        />
      )}

      {/* Compact Stats Panel - right side, inside the zone */}
      {drawingState === 'complete' && calculation.isValid && entryY !== null && (
        <div
          className="absolute pointer-events-auto"
          style={{
            right: '12%',
            top: isLong
              ? Math.min(entryY, tpY ?? entryY) + 8
              : Math.min(entryY, slY ?? entryY) + 8,
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
                {calculation.positionSize.toFixed(2)}
              </span>
              {' '}qty
            </span>
            <span style={{ color: '#ef5350', fontVariantNumeric: 'tabular-nums' }}>
              -${calculation.riskAmount.toFixed(0)}
            </span>
            {calculation.riskRewardRatio !== null && (
              <span style={{ color: '#26a69a', fontVariantNumeric: 'tabular-nums' }}>
                {calculation.riskRewardRatio.toFixed(1)}R
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
              {isSubmitting ? '...' : side}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * DraggableHandle - Draggable price level indicator
 * DRAW-06: Allows users to adjust SL/TP by dragging
 */
function DraggableHandle({
  y,
  price,
  label,
  amount,
  type,
  leftX = 0,
  onDragStart,
  isDragging,
  isHovered,
  onHover,
  interactive = true,
}: {
  y: number;
  price: number;
  label: string;
  amount?: number;
  type: 'entry' | 'stopLoss' | 'takeProfit';
  leftX?: number;
  onDragStart: () => void;
  isDragging: boolean;
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
  interactive?: boolean;
}) {
  // TradingView color scheme
  const colors = {
    entry: {
      bg: '#ffffff',
      text: '#000000',
      line: '#ffffff',
      lineStyle: 'dashed' as const,
    },
    stopLoss: {
      bg: '#ef5350', // TradingView red
      text: '#000000',
      line: '#ef5350',
      lineStyle: 'solid' as const,
    },
    takeProfit: {
      bg: '#26a69a', // TradingView green
      text: '#000000',
      line: '#26a69a',
      lineStyle: 'solid' as const,
    },
  };

  const { bg, text, line, lineStyle } = colors[type];

  return (
    <div
      className={`absolute right-0 flex items-center ${interactive ? 'pointer-events-auto' : 'pointer-events-none'}`}
      style={{ top: y - 1, left: leftX }}
      onMouseEnter={() => interactive && onHover(true)}
      onMouseLeave={() => interactive && onHover(false)}
    >
      {/* Price line - thin 1px */}
      <div
        className={`flex-1 ${lineStyle === 'dashed' ? 'border-dashed' : ''}`}
        style={{
          borderTopWidth: 1,
          borderTopStyle: lineStyle === 'dashed' ? 'dashed' : 'solid',
          borderColor: line,
          opacity: isDragging || isHovered ? 1 : 0.7,
        }}
      />

      {/* Compact Handle Label */}
      <div
        onMouseDown={(e) => {
          if (!interactive) return;
          e.preventDefault();
          onDragStart();
        }}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm select-none"
        style={{
          backgroundColor: bg,
          cursor: interactive ? 'ns-resize' : 'default',
          opacity: isDragging || isHovered ? 1 : 0.9,
          transform: isDragging ? 'scale(1.05)' : 'none',
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

export default PositionZoneOverlay;
