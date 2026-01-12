import { useState, useCallback, useEffect, useContext } from 'react';
import { toast } from 'sonner';
import { ChartManager } from '../../utils/chart_manager';
import { useRiskCalculation, RiskCalculationResult } from '../../hooks/useRiskCalculation';
import { createOrder, getRiskConfig, RiskConfig } from '../../utils/requests';
import { TradingModeContext } from '../../state/TradingModeProvider';
import { PositionZoneOverlay } from './PositionZoneOverlay';

/**
 * Drawing state machine states
 * DRAW-02: State machine for drawable position tool
 */
export type DrawingState = 'idle' | 'drawing_entry' | 'drawing_sl' | 'drawing_tp' | 'complete';

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
 * PositionDrawingTool - Drawable position entry on chart
 *
 * State Machine:
 * idle → drawing_entry → drawing_sl → drawing_tp → complete
 *
 * User Flow:
 * 1. Click chart → Sets entry price
 * 2. Drag mouse → Sets stop loss
 * 3. Click again → Sets take profit
 * 4. Execute or cancel
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
      setDrawingState('drawing_entry');
    } else if (!isActive && drawingState !== 'idle') {
      handleCancel();
    }
  }, [isActive]);

  // Update price lines on chart
  useEffect(() => {
    if (!chartManager) return;

    // Entry line
    if (levels.entryPrice !== null) {
      chartManager.createPriceLine('entry', {
        price: levels.entryPrice,
        color: '#ffffff',
        lineWidth: 2,
        title: 'Entry',
      });
    } else {
      chartManager.removePriceLine('entry');
    }

    // Stop loss line
    if (levels.stopLossPrice !== null) {
      chartManager.createPriceLine('stopLoss', {
        price: levels.stopLossPrice,
        color: '#ef4444',
        lineWidth: 2,
        title: 'SL',
      });
    } else {
      chartManager.removePriceLine('stopLoss');
    }

    // Take profit line
    if (levels.takeProfitPrice !== null) {
      chartManager.createPriceLine('takeProfit', {
        price: levels.takeProfitPrice,
        color: '#22c55e',
        lineWidth: 2,
        title: 'TP',
      });
    } else {
      chartManager.removePriceLine('takeProfit');
    }
  }, [chartManager, levels]);

  // Handle chart click
  const handleChartClick = useCallback((price: number) => {
    switch (drawingState) {
      case 'drawing_entry':
        setLevels(prev => ({ ...prev, entryPrice: price }));
        setDrawingState('drawing_sl');
        break;
      case 'drawing_sl':
        setLevels(prev => ({ ...prev, stopLossPrice: price }));
        setDrawingState('drawing_tp');
        break;
      case 'drawing_tp':
        setLevels(prev => ({ ...prev, takeProfitPrice: price }));
        setDrawingState('complete');
        break;
    }
  }, [drawingState]);

  // Handle mouse move for preview
  const handleMouseMove = useCallback((price: number | null) => {
    setPreviewPrice(price);
  }, []);

  // Subscribe to chart events
  useEffect(() => {
    if (!chartManager || !isActive) return;

    const unsubClick = chartManager.subscribeClick((param) => {
      if (param.point) {
        const price = chartManager.coordinateToPrice(param.point.y);
        if (price !== null) {
          handleChartClick(price);
        }
      }
    });

    const unsubMove = chartManager.subscribeCrosshairMove((param) => {
      if (param.point) {
        const price = chartManager.coordinateToPrice(param.point.y);
        handleMouseMove(price);
      } else {
        handleMouseMove(null);
      }
    });

    return () => {
      unsubClick();
      unsubMove();
    };
  }, [chartManager, isActive, handleChartClick, handleMouseMove]);

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
    chartManager?.removeAllPriceLines();
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
