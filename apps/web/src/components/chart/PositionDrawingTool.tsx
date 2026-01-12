import { useState, useCallback, useEffect, useContext, useRef } from 'react';
import { toast } from 'sonner';
import { ChartManager } from '../../utils/chart_manager';
import { useRiskCalculation, RiskCalculationResult } from '../../hooks/useRiskCalculation';
import { createOrder, getRiskConfig, RiskConfig } from '../../utils/requests';
import { TradingModeContext } from '../../state/TradingModeProvider';
import { PositionZoneOverlay } from './PositionZoneOverlay';

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
  });
  const [previewPrice, setPreviewPrice] = useState<number | null>(null);
  const [riskConfig, setRiskConfig] = useState<RiskConfig | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for stable access in event handlers (avoid stale closures)
  const drawingStateRef = useRef<DrawingState>('idle');
  const levelsRef = useRef<PositionLevels>({ entryPrice: null, stopLossPrice: null, takeProfitPrice: null });

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
  const side: 'LONG' | 'SHORT' = levels.entryPrice && levels.stopLossPrice
    ? levels.entryPrice > levels.stopLossPrice ? 'LONG' : 'SHORT'
    : 'LONG';

  // Activate drawing mode
  useEffect(() => {
    if (isActive && drawingState === 'idle') {
      setDrawingState('ready');
    } else if (!isActive && drawingState !== 'idle') {
      handleCancel();
    }
  }, [isActive]);

  // Note: Price lines are rendered by PositionZoneOverlay's DraggableHandle components
  // No native chart price lines needed (they caused double lines)

  // Default R:R ratio for auto TP calculation
  const defaultRR = parseFloat(riskConfig?.min_risk_reward_ratio ?? '2') || 2;
  const defaultRRRef = useRef(defaultRR);
  useEffect(() => { defaultRRRef.current = defaultRR; }, [defaultRR]);

  // Subscribe to chart events (drag-based) - uses refs to avoid stale closures
  useEffect(() => {
    if (!chartManager || !isActive) return;

    const chartContainer = chartManager.getChartElement();
    if (!chartContainer) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (drawingStateRef.current !== 'ready') return;
      const rect = chartContainer.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const price = chartManager.coordinateToPrice(y);
      if (price !== null) {
        // Set entry price and start dragging
        setLevels({ entryPrice: price, stopLossPrice: price, takeProfitPrice: null });
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
        setLevels({ entryPrice: null, stopLossPrice: null, takeProfitPrice: null });
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
    setDrawingState('idle');
    setLevels({ entryPrice: null, stopLossPrice: null, takeProfitPrice: null });
    setPreviewPrice(null);
    onDeactivate();
  }, [onDeactivate]);

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
        side: side === 'LONG' ? 'BUY' : 'SELL',
        quantity: calculation.positionSize,
        price: levels.entryPrice,
        userId,
        executionMode: mode,
      });

      toast.success(`${side} order placed`, {
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

  // Update level from drag - DRAW-06
  const handleLevelChange = useCallback((type: 'entry' | 'stopLoss' | 'takeProfit', price: number) => {
    setLevels(prev => ({
      ...prev,
      [type === 'entry' ? 'entryPrice' : type === 'stopLoss' ? 'stopLossPrice' : 'takeProfitPrice']: price,
    }));
  }, []);

  if (!isActive || drawingState === 'idle') {
    return null;
  }

  return (
    <PositionZoneOverlay
      chartManager={chartManager}
      levels={levels}
      previewPrice={previewPrice}
      drawingState={drawingState}
      calculation={calculation}
      side={side}
      isSubmitting={isSubmitting}
      onExecute={handleExecute}
      onCancel={handleCancel}
      onLevelChange={handleLevelChange}
    />
  );
}

export type { RiskCalculationResult };
export default PositionDrawingTool;
