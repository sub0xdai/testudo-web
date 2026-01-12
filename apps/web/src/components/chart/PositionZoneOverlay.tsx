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

  // Calculate zone heights
  const isLong = side === 'LONG';

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    >
      {/* Instructions Bar */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-container-bg/90 px-4 py-2 rounded-lg border border-container-border pointer-events-auto">
        <span className="text-xs font-imperial text-text-secondary">
          {getInstructionText()}
        </span>
        {drawingState !== 'idle' && (
          <button
            onClick={onCancel}
            className="ml-4 text-xs text-negative-red hover:text-negative-red/80"
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
            backgroundColor: 'rgba(34, 197, 94, 0.15)',
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
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
          }}
        />
      )}

      {/* Entry Line with Handle */}
      {entryY !== null && levels.entryPrice !== null && (
        <DraggableHandle
          y={entryY}
          price={levels.entryPrice}
          label="Entry"
          color="#ffffff"
          onDragStart={() => setDragging('entry')}
          isDragging={dragging === 'entry'}
        />
      )}

      {/* Stop Loss Line with Handle */}
      {slY !== null && levels.stopLossPrice !== null && (
        <DraggableHandle
          y={slY}
          price={levels.stopLossPrice}
          label={`SL ${calculation.isValid ? `(-$${calculation.riskAmount.toFixed(0)})` : ''}`}
          color="#ef4444"
          onDragStart={() => setDragging('stopLoss')}
          isDragging={dragging === 'stopLoss'}
        />
      )}

      {/* Take Profit Line with Handle */}
      {tpY !== null && levels.takeProfitPrice !== null && (
        <DraggableHandle
          y={tpY}
          price={levels.takeProfitPrice}
          label={`TP ${calculation.profitAmount !== null ? `(+$${calculation.profitAmount.toFixed(0)})` : ''}`}
          color="#22c55e"
          onDragStart={() => setDragging('takeProfit')}
          isDragging={dragging === 'takeProfit'}
        />
      )}

      {/* Control Panel - shown when complete */}
      {drawingState === 'complete' && calculation.isValid && (
        <div
          className="absolute left-1/2 -translate-x-1/2 bg-container-bg/95 px-4 py-3 rounded-lg border border-container-border pointer-events-auto"
          style={{
            top: entryY !== null ? entryY - 60 : '50%',
          }}
        >
          <div className="flex items-center gap-4 text-xs font-numeral">
            <div>
              <span className="text-text-tertiary">Size:</span>{' '}
              <span className="text-text-default">{calculation.positionSize.toFixed(4)}</span>
            </div>
            <div>
              <span className="text-text-tertiary">Risk:</span>{' '}
              <span className="text-negative-red">${calculation.riskAmount.toFixed(2)}</span>
            </div>
            {calculation.riskRewardRatio !== null && (
              <div>
                <span className="text-text-tertiary">R:R:</span>{' '}
                <span className="text-positive-green">{calculation.riskRewardRatio.toFixed(2)}</span>
              </div>
            )}
            <button
              onClick={onExecute}
              disabled={isSubmitting}
              className={`px-4 py-1.5 text-xs font-imperial font-semibold uppercase tracking-wider rounded transition-colors disabled:opacity-50 ${
                isLong
                  ? 'bg-status-success hover:bg-status-success/90 text-main-bg'
                  : 'bg-status-error hover:bg-status-error/90 text-main-bg'
              }`}
            >
              {isSubmitting ? 'Placing...' : `${side} (Enter)`}
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
  color,
  onDragStart,
  isDragging,
}: {
  y: number;
  price: number;
  label: string;
  color: string;
  onDragStart: () => void;
  isDragging: boolean;
}) {
  return (
    <div
      className="absolute left-0 right-0 flex items-center pointer-events-auto"
      style={{ top: y - 1 }}
    >
      {/* Price line */}
      <div
        className="flex-1 border-t-2"
        style={{ borderColor: color }}
      />

      {/* Handle */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          onDragStart();
        }}
        className={`
          flex items-center gap-2 px-2 py-1 rounded cursor-ns-resize
          transition-all duration-150
          ${isDragging ? 'scale-105 shadow-lg' : 'hover:scale-105'}
        `}
        style={{ backgroundColor: color }}
      >
        <span className="text-[10px] font-imperial font-semibold text-main-bg uppercase">
          {label}
        </span>
        <span className="text-[10px] font-numeral text-main-bg">
          {price.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

export default PositionZoneOverlay;
