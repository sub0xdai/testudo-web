import { useState, useCallback, useEffect, useContext, useRef } from 'react';
import { toast } from 'sonner';
import type { Time } from 'lightweight-charts';
import { ChartManager, type PositionLevels as PrimitiveLevels } from '../../utils/chart_manager';
import { useRiskCalculation, RiskCalculationResult } from '../../hooks/useRiskCalculation';
import { createOrder, getRiskConfig, RiskConfig } from '../../utils/requests';
import { TradingModeContext } from '../../state/TradingModeProvider';
import { PositionHandleOverlay } from './PositionHandleOverlay';

/**
 * Drawing state machine states
 * DRAW-02: State machine for drawable position tool
 *
 * Drag-based UX (TradingView style):
 * idle → ready → dragging → complete
 */
export type DrawingState = 'idle' | 'ready' | 'dragging' | 'complete';

export interface PositionLevels {
  entryPrice: number | null;
  stopLossPrice: number | null;
  takeProfitPrice: number | null;
  startTime: Time | null; // GEOM-05: Time anchor for bounded zones
  endTime?: Time;         // Optional: Zone right edge (defaults to chart edge)
}

interface PositionDrawingToolProps {
  chartManager: ChartManager | null;
  market: string;
  accountBalance: number;
  isActive: boolean;
  onDeactivate: () => void;
}

const DEFAULT_RISK_PERCENT = 2;

/**
 * PositionDrawingTool - Drawable position entry on chart (TradingView style)
 *
 * V5-15: Refactored to use hybrid primitive + DOM architecture
 * - Canvas: PositionZonePrimitive renders zones/lines (pan/zoom with chart)
 * - DOM: PositionHandleOverlay renders drag handles + stats panel
 *
 * State Machine:
 * idle → ready → dragging → complete
 *
 * User Flow (drag-based):
 * 1. Activate tool → ready state
 * 2. Click & hold (mousedown) → Sets entry, starts dragging
 * 3. Drag mouse → Updates SL in real-time, shows rectangle
 * 4. Release (mouseup) → Complete, auto-sets TP based on R:R
 * 5. Adjust handles or execute (Enter) / cancel (Esc)
 */
export function PositionDrawingTool({
  chartManager,
  market,
  accountBalance,
  isActive,
  onDeactivate,
}: PositionDrawingToolProps) {
  const { mode } = useContext(TradingModeContext);

  const [drawingState, setDrawingState] = useState<DrawingState>('idle');
  const [levels, setLevels] = useState<PositionLevels>({
    entryPrice: null,
    stopLossPrice: null,
    takeProfitPrice: null,
    startTime: null, // GEOM-05: Visual anchor for zone left edge
  });
  const [previewPrice, setPreviewPrice] = useState<number | null>(null);
  const [riskConfig, setRiskConfig] = useState<RiskConfig | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for stable access in event handlers (avoid stale closures)
  const drawingStateRef = useRef<DrawingState>('idle');
  const levelsRef = useRef<PositionLevels>({ entryPrice: null, stopLossPrice: null, takeProfitPrice: null, startTime: null });

  // Keep refs in sync with state
  useEffect(() => { drawingStateRef.current = drawingState; }, [drawingState]);
  useEffect(() => { levelsRef.current = levels; }, [levels]);

  // Load risk config
  useEffect(() => {
    getRiskConfig()
      .then(setRiskConfig)
      .catch(() => {
        // Use defaults
        setRiskConfig({
          account_risk_percent: String(DEFAULT_RISK_PERCENT),
          max_risk_amount: null,
          max_position_size: null,
          max_leverage: 1,
          daily_max_drawdown_percent: '5',
          max_open_positions: 5,
          require_stop_loss: true,
          default_stop_atr_multiplier: '2',
          min_risk_reward_ratio: '1.5',
        });
      });
  }, []);

  const riskPercent = parseFloat(riskConfig?.account_risk_percent ?? String(DEFAULT_RISK_PERCENT)) || DEFAULT_RISK_PERCENT;

  // Calculate position sizing
  const calculation = useRiskCalculation({
    entryPrice: levels.entryPrice ?? 0,
    stopLossPrice: levels.stopLossPrice ?? 0,
    takeProfitPrice: levels.takeProfitPrice ?? undefined,
    accountBalance,
    riskPercent,
    maxRiskAmount: riskConfig?.max_risk_amount ? parseFloat(riskConfig.max_risk_amount) : undefined,
    maxPositionSize: riskConfig?.max_position_size ? parseFloat(riskConfig.max_position_size) : undefined,
  });

  // Determine side based on entry vs stop loss
  const side: 'long' | 'short' = levels.entryPrice && levels.stopLossPrice
    ? levels.entryPrice > levels.stopLossPrice ? 'long' : 'short'
    : 'long';

  // Activate drawing mode
  useEffect(() => {
    if (isActive && drawingState === 'idle') {
      setDrawingState('ready');
    } else if (!isActive && drawingState !== 'idle') {
      handleCancel();
    }
  }, [isActive]);

  // Default R:R ratio for auto TP calculation
  const defaultRR = parseFloat(riskConfig?.min_risk_reward_ratio ?? '2') || 2;
  const defaultRRRef = useRef(defaultRR);
  useEffect(() => { defaultRRRef.current = defaultRR; }, [defaultRR]);

  // V5-15: Attach/detach canvas primitive based on drawing state
  // GEOM-05: Now includes startTime for time-anchored zones
  useEffect(() => {
    if (!chartManager) return;

    if (drawingState === 'complete' && levels.entryPrice && levels.stopLossPrice && levels.takeProfitPrice && levels.startTime) {
      // Attach primitive and update levels
      const primitive = chartManager.attachPositionPrimitive();
      const primitiveLevels: PrimitiveLevels = {
        entry: levels.entryPrice,
        stopLoss: levels.stopLossPrice,
        takeProfit: levels.takeProfitPrice,
        side,
        startTime: levels.startTime,
        endTime: levels.endTime, // Optional: zone right edge
      };
      primitive.updateLevels(primitiveLevels);
    } else if (drawingState === 'dragging' && levels.entryPrice && levels.stopLossPrice && levels.startTime) {
      // During drag, show entry and SL zones (TP will be calculated on release)
      const primitive = chartManager.getPositionPrimitive() ?? chartManager.attachPositionPrimitive();
      // For dragging, use SL as a temporary TP to show the risk zone
      const primitiveLevels: PrimitiveLevels = {
        entry: levels.entryPrice,
        stopLoss: levels.stopLossPrice,
        takeProfit: levels.entryPrice, // Just show risk zone during drag
        side,
        startTime: levels.startTime,
        endTime: levels.endTime,
      };
      primitive.updateLevels(primitiveLevels);
    } else if (drawingState === 'idle' || drawingState === 'ready') {
      // Detach primitive when not drawing
      chartManager.detachPositionPrimitive();
    }

    return () => {
      // Cleanup on unmount
      if (drawingState === 'idle') {
        chartManager.detachPositionPrimitive();
      }
    };
  }, [chartManager, drawingState, levels, side]);

  // Subscribe to chart events (drag-based) - uses refs to avoid stale closures
  useEffect(() => {
    if (!chartManager || !isActive) return;

    const chartContainer = chartManager.getChartElement();
    if (!chartContainer) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (drawingStateRef.current !== 'ready') return;
      const rect = chartContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const price = chartManager.coordinateToPrice(y);
      // GEOM-05: Capture time coordinate for zone left edge
      const time = chartManager.coordinateToTime(x);
      if (price !== null && time !== null) {
        // Set entry price, startTime, and start dragging
        setLevels({ entryPrice: price, stopLossPrice: price, takeProfitPrice: null, startTime: time });
        setDrawingState('dragging');
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (drawingStateRef.current !== 'dragging') return;
      const rect = chartContainer.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const price = chartManager.coordinateToPrice(y);
      if (price !== null && levelsRef.current.entryPrice !== null) {
        // Update SL in real-time during drag
        setLevels(prev => ({ ...prev, stopLossPrice: price }));
        setPreviewPrice(price);
      }
    };

    const handleMouseUp = () => {
      if (drawingStateRef.current !== 'dragging') return;
      const currentLevels = levelsRef.current;
      if (currentLevels.entryPrice === null || currentLevels.stopLossPrice === null) return;

      // Auto-calculate TP based on R:R ratio
      const riskDistance = Math.abs(currentLevels.entryPrice - currentLevels.stopLossPrice);

      // Require minimum drag distance (at least 0.1% of entry price)
      const minDistance = currentLevels.entryPrice * 0.001;
      if (riskDistance < minDistance) {
        // Too small - cancel the draw
        setDrawingState('ready');
        setLevels({ entryPrice: null, stopLossPrice: null, takeProfitPrice: null, startTime: null });
        return;
      }

      const rewardDistance = riskDistance * defaultRRRef.current;
      const isLong = currentLevels.entryPrice > currentLevels.stopLossPrice;
      const tpPrice = isLong
        ? currentLevels.entryPrice + rewardDistance
        : currentLevels.entryPrice - rewardDistance;

      setLevels(prev => ({ ...prev, takeProfitPrice: tpPrice }));
      setDrawingState('complete');
    };

    // Subscribe to crosshair move for preview (when not dragging)
    const unsubMove = chartManager.subscribeCrosshairMove((param) => {
      if (drawingStateRef.current === 'ready' && param.point) {
        const price = chartManager.coordinateToPrice(param.point.y);
        setPreviewPrice(price);
      }
    });

    chartContainer.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      unsubMove();
      chartContainer.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [chartManager, isActive]); // Minimal deps - use refs for state

  // Keyboard shortcuts - DRAW-09
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      } else if (e.key === 'Enter' && drawingState === 'complete') {
        e.preventDefault();
        handleExecute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, drawingState]);

  const handleCancel = useCallback(() => {
    if (chartManager) {
      chartManager.detachPositionPrimitive();
    }
    setDrawingState('idle');
    setLevels({ entryPrice: null, stopLossPrice: null, takeProfitPrice: null, startTime: null });
    setPreviewPrice(null);
    onDeactivate();
  }, [chartManager, onDeactivate]);

  const handleExecute = useCallback(async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      toast.error('Please log in to place orders');
      return;
    }

    if (!calculation.isValid) {
      toast.error(calculation.validationError || 'Invalid order parameters');
      return;
    }

    if (!levels.entryPrice || !levels.stopLossPrice) {
      toast.error('Entry and stop loss are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrder({
        market,
        side: side === 'long' ? 'BUY' : 'SELL',
        quantity: calculation.positionSize,
        price: levels.entryPrice,
        userId,
        executionMode: mode,
      });

      toast.success(`${side.toUpperCase()} order placed`, {
        description: `${calculation.positionSize} @ ${levels.entryPrice.toFixed(2)}`,
      });

      handleCancel();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to place order';
      toast.error('Order failed', { description: message });
    } finally {
      setIsSubmitting(false);
    }
  }, [calculation, levels, market, mode, side, handleCancel]);

  // V5-12: Update level from handle drag - updates both state and primitive
  // GEOM-05: Now preserves startTime for time-anchored zones
  const handleLevelChange = useCallback((type: 'entry' | 'stopLoss' | 'takeProfit', price: number) => {
    setLevels(prev => {
      const newLevels = {
        ...prev,
        [type === 'entry' ? 'entryPrice' : type === 'stopLoss' ? 'stopLossPrice' : 'takeProfitPrice']: price,
      };

      // Update primitive immediately for smooth visuals
      if (chartManager && newLevels.entryPrice && newLevels.stopLossPrice && newLevels.takeProfitPrice && newLevels.startTime) {
        const isLong = newLevels.entryPrice > newLevels.stopLossPrice;
        chartManager.updatePositionLevels({
          entry: newLevels.entryPrice,
          stopLoss: newLevels.stopLossPrice,
          takeProfit: newLevels.takeProfitPrice,
          side: isLong ? 'long' : 'short',
          startTime: newLevels.startTime,
          endTime: newLevels.endTime, // Include endTime if set
        });
      }

      return newLevels;
    });
  }, [chartManager]);

  // Handle endTime change from right-edge drag
  const handleEndTimeChange = useCallback((time: Time | undefined) => {
    setLevels(prev => {
      const newLevels = { ...prev, endTime: time };

      // Update primitive immediately for smooth visuals
      if (chartManager && newLevels.entryPrice && newLevels.stopLossPrice && newLevels.takeProfitPrice && newLevels.startTime) {
        const isLong = newLevels.entryPrice > newLevels.stopLossPrice;
        chartManager.updatePositionLevels({
          entry: newLevels.entryPrice,
          stopLoss: newLevels.stopLossPrice,
          takeProfit: newLevels.takeProfitPrice,
          side: isLong ? 'long' : 'short',
          startTime: newLevels.startTime,
          endTime: time,
        });
      }

      return newLevels;
    });
  }, [chartManager]);

  // Don't render anything in idle or ready state (just preview line via crosshair)
  if (!isActive || drawingState === 'idle') {
    return null;
  }

  // Ready state - show preview line
  if (drawingState === 'ready') {
    return (
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        {/* Preview line at cursor position */}
        {previewPrice !== null && chartManager && (
          <div
            className="absolute left-0 right-0 border-t border-dashed border-white/50"
            style={{ top: chartManager.priceToCoordinate(previewPrice) ?? 0 }}
          />
        )}
        {/* Instruction */}
        <div className="absolute top-2 right-2 pointer-events-auto">
          <div
            className="flex items-center gap-2 px-2 py-1 rounded text-[11px]"
            style={{ background: 'rgba(30, 34, 45, 0.9)' }}
          >
            <span style={{ color: '#787b86' }}>Click and drag to draw position</span>
            <button
              onClick={handleCancel}
              className="px-2 py-0.5 rounded cursor-pointer hover:bg-[#ef5350]/20"
              style={{ color: '#ef5350' }}
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dragging state - show instruction, primitive renders zones
  if (drawingState === 'dragging') {
    return (
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        <div className="absolute top-2 right-2 pointer-events-auto">
          <div
            className="flex items-center gap-2 px-2 py-1 rounded text-[11px]"
            style={{ background: 'rgba(30, 34, 45, 0.9)' }}
          >
            <span style={{ color: '#787b86' }}>Release to set stop loss</span>
            <button
              onClick={handleCancel}
              className="px-2 py-0.5 rounded cursor-pointer hover:bg-[#ef5350]/20"
              style={{ color: '#ef5350' }}
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Complete state - render handle overlay (zones rendered by primitive)
  if (drawingState === 'complete' && levels.entryPrice && levels.stopLossPrice && levels.takeProfitPrice && levels.startTime) {
    return (
      <PositionHandleOverlay
        chartManager={chartManager}
        levels={{
          entry: levels.entryPrice,
          stopLoss: levels.stopLossPrice,
          takeProfit: levels.takeProfitPrice,
          side,
          startTime: levels.startTime,
          endTime: levels.endTime, // Optional: zone right edge
        }}
        onLevelChange={handleLevelChange}
        onEndTimeChange={handleEndTimeChange}
        onExecute={handleExecute}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        stats={calculation.isValid ? {
          quantity: calculation.positionSize,
          riskAmount: calculation.riskAmount,
          riskRewardRatio: calculation.riskRewardRatio,
        } : undefined}
      />
    );
  }

  return null;
}

export type { RiskCalculationResult };
export default PositionDrawingTool;
