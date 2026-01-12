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
  const [dragging, setDragging] = useState<'entry' | 'stopLoss' | 'takeProfit' | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<'entry' | 'stopLoss' | 'takeProfit' | null>(null);

  // Convert prices to Y coordinates
  const getY = useCallback((price: number | null): number | null => {
    if (!chartManager || price === null) return null;
    return chartManager.priceToCoordinate(price);
  }, [chartManager]);

  const entryY = getY(levels.entryPrice);
  const slY = getY(levels.stopLossPrice);
  const tpY = getY(levels.takeProfitPrice);
  const previewY = getY(previewPrice);

  // Handle drag
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

  // Get instruction text based on state
  const getInstructionText = () => {
    switch (drawingState) {
      case 'drawing_entry':
        return 'Click to set entry price';
      case 'drawing_sl':
        return 'Click to set stop loss';
      case 'drawing_tp':
        return 'Click to set take profit (or press Enter to skip)';
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
      {/* Instructions Bar */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-container-bg/95 px-4 py-2 rounded-lg border border-container-border pointer-events-auto flex items-center gap-3">
        <span className="text-xs font-imperial text-text-default">
          {getInstructionText()}
        </span>
        {drawingState !== 'idle' && (
          <button
            onClick={onCancel}
            className="px-3 py-1 text-[10px] font-imperial font-semibold uppercase tracking-wider
                       text-negative-red border border-negative-red/50 rounded
                       hover:bg-negative-red/10 hover:border-negative-red
                       transition-colors"
          >
            Cancel (Esc)
          </button>
        )}
      </div>

      {/* Preview line while drawing */}
      {previewY !== null && drawingState !== 'complete' && drawingState !== 'idle' && (
        <div
          className="absolute left-0 right-0 border-t border-dashed border-text-secondary/50"
          style={{ top: previewY }}
        />
      )}

      {/* Profit Zone (green) */}
      {entryY !== null && tpY !== null && (
        <div
          className="absolute left-0 right-0"
          style={{
            top: Math.min(entryY, tpY),
            height: Math.abs(tpY - entryY),
            backgroundColor: 'rgba(34, 197, 94, 0.12)',
          }}
        />
      )}

      {/* Loss Zone (red) */}
      {entryY !== null && slY !== null && (
        <div
          className="absolute left-0 right-0"
          style={{
            top: Math.min(entryY, slY),
            height: Math.abs(slY - entryY),
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
          }}
        />
      )}

      {/* Entry Line with Handle */}
      {entryY !== null && levels.entryPrice !== null && (
        <DraggableHandle
          y={entryY}
          price={levels.entryPrice}
          label="Entry"
          type="entry"
          onDragStart={() => setDragging('entry')}
          isDragging={dragging === 'entry'}
          isHovered={hoveredHandle === 'entry'}
          onHover={(h) => setHoveredHandle(h ? 'entry' : null)}
        />
      )}

      {/* Stop Loss Line with Handle */}
      {slY !== null && levels.stopLossPrice !== null && (
        <DraggableHandle
          y={slY}
          price={levels.stopLossPrice}
          label="SL"
          amount={calculation.isValid ? -calculation.riskAmount : undefined}
          type="stopLoss"
          onDragStart={() => setDragging('stopLoss')}
          isDragging={dragging === 'stopLoss'}
          isHovered={hoveredHandle === 'stopLoss'}
          onHover={(h) => setHoveredHandle(h ? 'stopLoss' : null)}
        />
      )}

      {/* Take Profit Line with Handle */}
      {tpY !== null && levels.takeProfitPrice !== null && (
        <DraggableHandle
          y={tpY}
          price={levels.takeProfitPrice}
          label="TP"
          amount={calculation.profitAmount ?? undefined}
          type="takeProfit"
          onDragStart={() => setDragging('takeProfit')}
          isDragging={dragging === 'takeProfit'}
          isHovered={hoveredHandle === 'takeProfit'}
          onHover={(h) => setHoveredHandle(h ? 'takeProfit' : null)}
        />
      )}

      {/* Control Panel HUD - shown when complete */}
      {drawingState === 'complete' && calculation.isValid && (
        <div
          className="absolute left-1/2 -translate-x-1/2 pointer-events-auto"
          style={{
            top: entryY !== null ? entryY - 70 : '50%',
          }}
        >
          <div className="flex items-stretch bg-[#1a1a1a] rounded-lg border border-container-border overflow-hidden shadow-xl">
            {/* Direction indicator bar */}
            <div
              className="w-1.5"
              style={{ backgroundColor: isLong ? '#22c55e' : '#ef4444' }}
            />

            {/* Stats */}
            <div className="flex items-center gap-1 px-3 py-2.5">
              {/* Size */}
              <div className="px-2 border-r border-container-border">
                <span className="text-[10px] text-text-tertiary uppercase block">Size</span>
                <span className="text-sm font-numeral text-text-default">{calculation.positionSize.toFixed(2)}</span>
              </div>

              {/* Risk */}
              <div className="px-2 border-r border-container-border">
                <span className="text-[10px] text-text-tertiary uppercase block">Risk</span>
                <span className="text-sm font-numeral text-negative-red">${calculation.riskAmount.toFixed(0)}</span>
              </div>

              {/* R:R */}
              {calculation.riskRewardRatio !== null && (
                <div className="px-2 border-r border-container-border">
                  <span className="text-[10px] text-text-tertiary uppercase block">R:R</span>
                  <span className="text-sm font-numeral text-positive-green">{calculation.riskRewardRatio.toFixed(2)}</span>
                </div>
              )}

              {/* Execute Button */}
              <button
                onClick={onExecute}
                disabled={isSubmitting}
                className={`ml-2 px-4 py-2 text-xs font-imperial font-bold uppercase tracking-wider rounded transition-all disabled:opacity-50 ${
                  isLong
                    ? 'bg-[#22c55e] hover:bg-[#16a34a] text-[#052e16]'
                    : 'bg-[#ef4444] hover:bg-[#dc2626] text-[#450a0a]'
                }`}
              >
                {isSubmitting ? 'Placing...' : side}
              </button>

              {/* Keyboard hint */}
              <span className="ml-2 text-[10px] text-text-secondary font-mono">(Enter)</span>
            </div>
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
  onDragStart,
  isDragging,
  isHovered,
  onHover,
}: {
  y: number;
  price: number;
  label: string;
  amount?: number;
  type: 'entry' | 'stopLoss' | 'takeProfit';
  onDragStart: () => void;
  isDragging: boolean;
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
}) {
  // Color scheme based on type
  const colors = {
    entry: {
      bg: '#ffffff',
      text: '#000000',
      line: '#ffffff',
      lineStyle: 'dashed' as const,
    },
    stopLoss: {
      bg: '#ef4444',
      text: '#450a0a', // Dark red text for contrast
      line: '#ef4444',
      lineStyle: 'solid' as const,
    },
    takeProfit: {
      bg: '#22c55e',
      text: '#052e16', // Dark green text for contrast
      line: '#22c55e',
      lineStyle: 'solid' as const,
    },
  };

  const { bg, text, line, lineStyle } = colors[type];

  return (
    <div
      className="absolute left-0 right-0 flex items-center pointer-events-auto"
      style={{ top: y - 1 }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Price line */}
      <div
        className={`flex-1 transition-all duration-150 ${
          lineStyle === 'dashed' ? 'border-t-2 border-dashed' : 'border-t-2'
        }`}
        style={{
          borderColor: line,
          opacity: isDragging || isHovered ? 1 : 0.8,
          borderWidth: isDragging || isHovered ? 3 : 2,
        }}
      />

      {/* Handle */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          onDragStart();
        }}
        className={`
          flex items-center gap-1.5 px-2 py-1 rounded-sm
          transition-all duration-150 select-none
          ${isDragging ? 'scale-110 shadow-lg' : isHovered ? 'scale-105 shadow-md' : ''}
        `}
        style={{
          backgroundColor: bg,
          cursor: 'ns-resize',
          boxShadow: isDragging || isHovered ? `0 0 12px ${bg}40` : undefined,
        }}
      >
        {/* Label with amount */}
        <span
          className="text-[10px] font-imperial font-bold uppercase"
          style={{ color: text }}
        >
          {label}
          {amount !== undefined && (
            <span className="ml-1 font-numeral">
              ({amount >= 0 ? '+' : ''}{amount.toFixed(0)})
            </span>
          )}
        </span>

        {/* Price */}
        <span
          className="text-[10px] font-numeral font-semibold"
          style={{ color: text }}
        >
          {price.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

export default PositionZoneOverlay;
