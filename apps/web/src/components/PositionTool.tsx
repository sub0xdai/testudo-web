import { useState, useCallback, useMemo, useContext } from 'react';
import { TradesContext } from '../state/TradesProvider';
import { PositionDraft, CreateTradeRequest } from '../utils/types';

interface PositionToolProps {
  market: string;
  currentPrice: number;
  accountBalance: number;
  riskPercent?: number;
  onCreateTrade: (trade: CreateTradeRequest) => Promise<void>;
}

/**
 * Position Tool Component (D.0)
 *
 * Allows traders to visually plan trades with:
 * - Entry price
 * - Stop loss price
 * - Take profit price
 * - Auto-calculated position size based on risk
 * - Real-time R:R ratio display
 */
export function PositionTool({
  market,
  currentPrice,
  accountBalance,
  riskPercent = 2,
  onCreateTrade,
}: PositionToolProps) {
  const { ticker: _ticker } = useContext(TradesContext);

  const [isActive, setIsActive] = useState(false);
  const [side, setSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [entryPrice, setEntryPrice] = useState(currentPrice);
  const [stopLossPrice, setStopLossPrice] = useState(0);
  const [takeProfitPrice, setTakeProfitPrice] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate position metrics
  const positionMetrics = useMemo(() => {
    if (!entryPrice || !stopLossPrice || entryPrice === stopLossPrice) {
      return null;
    }

    const riskPerUnit = Math.abs(entryPrice - stopLossPrice);
    const riskAmount = (accountBalance * riskPercent) / 100;
    const quantity = riskAmount / riskPerUnit;

    const rewardPerUnit = takeProfitPrice ? Math.abs(takeProfitPrice - entryPrice) : 0;
    const riskRewardRatio = rewardPerUnit > 0 ? rewardPerUnit / riskPerUnit : 0;

    const stopLossPercent = ((stopLossPrice - entryPrice) / entryPrice) * 100;
    const takeProfitPercent = takeProfitPrice
      ? ((takeProfitPrice - entryPrice) / entryPrice) * 100
      : 0;

    return {
      quantity: Math.abs(quantity),
      riskAmount,
      riskRewardRatio,
      stopLossPercent,
      takeProfitPercent,
      potentialProfit: quantity * rewardPerUnit,
      potentialLoss: riskAmount,
    };
  }, [entryPrice, stopLossPrice, takeProfitPrice, accountBalance, riskPercent]);

  // Initialize position based on side
  const initializePosition = useCallback((positionSide: 'LONG' | 'SHORT') => {
    setSide(positionSide);
    setEntryPrice(currentPrice);

    // Default SL: 2% away from entry
    const slOffset = currentPrice * 0.02;
    const tpOffset = currentPrice * 0.04; // Default TP: 4% (2:1 R:R)

    if (positionSide === 'LONG') {
      setStopLossPrice(currentPrice - slOffset);
      setTakeProfitPrice(currentPrice + tpOffset);
    } else {
      setStopLossPrice(currentPrice + slOffset);
      setTakeProfitPrice(currentPrice - tpOffset);
    }

    setIsActive(true);
  }, [currentPrice]);

  // Handle trade submission
  const handleSubmit = useCallback(async () => {
    if (!positionMetrics) return;

    setIsSubmitting(true);
    try {
      const trade: CreateTradeRequest = {
        symbol: market,
        side: side === 'LONG' ? 'buy' : 'sell',
        quantity: positionMetrics.quantity,
        entry_price: entryPrice,
        stop_loss_price: stopLossPrice,
        take_profit_price: takeProfitPrice || undefined,
      };

      await onCreateTrade(trade);
      setIsActive(false);
    } catch (error) {
      console.error('Failed to create trade:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [market, side, entryPrice, stopLossPrice, takeProfitPrice, positionMetrics, onCreateTrade]);

  // Cancel position drawing
  const handleCancel = useCallback(() => {
    setIsActive(false);
    setEntryPrice(currentPrice);
    setStopLossPrice(0);
    setTakeProfitPrice(0);
  }, [currentPrice]);

  // Format currency
  const formatCurrency = (amount: number) => `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  if (!isActive) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => initializePosition('LONG')}
          className="px-3 py-1.5 bg-positive-green/20 text-positive-green text-xs font-imperial
                   hover:bg-positive-green/30 transition-colors border border-positive-green/50"
        >
          LONG
        </button>
        <button
          onClick={() => initializePosition('SHORT')}
          className="px-3 py-1.5 bg-negative-red/20 text-negative-red text-xs font-imperial
                   hover:bg-negative-red/30 transition-colors border border-negative-red/50"
        >
          SHORT
        </button>
      </div>
    );
  }

  const isLong = side === 'LONG';
  const sideColor = isLong ? 'positive-green' : 'negative-red';

  return (
    <div className="bg-container-bg border border-container-border p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className={`text-${sideColor} font-imperial font-bold text-sm`}>
          {side} POSITION
        </div>
        <button
          onClick={handleCancel}
          className="text-text-secondary hover:text-text-default text-xs"
        >
          Cancel
        </button>
      </div>

      {/* Price Inputs */}
      <div className="space-y-3">
        {/* Entry */}
        <div className="flex items-center justify-between">
          <label className="text-text-secondary text-xs font-imperial">Entry</label>
          <input
            type="number"
            value={entryPrice}
            onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
            className="bg-container-bg-hover border border-container-border px-2 py-1
                     text-text-default text-xs text-right w-32 font-numeral"
          />
        </div>

        {/* Stop Loss */}
        <div className="flex items-center justify-between">
          <label className="text-negative-red text-xs font-imperial">Stop Loss</label>
          <div className="flex items-center gap-2">
            <span className="text-negative-red text-xs font-numeral">
              {positionMetrics ? `(${positionMetrics.stopLossPercent.toFixed(2)}%)` : ''}
            </span>
            <input
              type="number"
              value={stopLossPrice}
              onChange={(e) => setStopLossPrice(parseFloat(e.target.value) || 0)}
              className="bg-container-bg-hover border border-negative-red/50 px-2 py-1
                       text-negative-red text-xs text-right w-32 font-numeral"
            />
          </div>
        </div>

        {/* Take Profit */}
        <div className="flex items-center justify-between">
          <label className="text-positive-green text-xs font-imperial">Take Profit</label>
          <div className="flex items-center gap-2">
            <span className="text-positive-green text-xs font-numeral">
              {positionMetrics ? `(${positionMetrics.takeProfitPercent.toFixed(2)}%)` : ''}
            </span>
            <input
              type="number"
              value={takeProfitPrice}
              onChange={(e) => setTakeProfitPrice(parseFloat(e.target.value) || 0)}
              className="bg-container-bg-hover border border-positive-green/50 px-2 py-1
                       text-positive-green text-xs text-right w-32 font-numeral"
            />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-container-border" />

      {/* Calculated Metrics */}
      {positionMetrics && (
        <div className="space-y-2">
          {/* Position Size */}
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-xs font-imperial">Position Size</span>
            <span className="text-text-emphasis text-xs font-numeral font-bold">
              {positionMetrics.quantity.toFixed(8)}
            </span>
          </div>

          {/* Risk Amount */}
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-xs font-imperial">Risk Amount</span>
            <span className="text-negative-red text-xs font-numeral">
              {formatCurrency(positionMetrics.riskAmount)} ({riskPercent}%)
            </span>
          </div>

          {/* Potential Profit */}
          {positionMetrics.potentialProfit > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-text-secondary text-xs font-imperial">Potential Profit</span>
              <span className="text-positive-green text-xs font-numeral">
                {formatCurrency(positionMetrics.potentialProfit)}
              </span>
            </div>
          )}

          {/* Risk/Reward Ratio */}
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-xs font-imperial">Risk/Reward</span>
            <span className={`text-xs font-numeral font-bold ${
              positionMetrics.riskRewardRatio >= 2 ? 'text-positive-green' :
              positionMetrics.riskRewardRatio >= 1 ? 'text-yellow-500' : 'text-negative-red'
            }`}>
              1:{positionMetrics.riskRewardRatio.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!positionMetrics || isSubmitting}
        className={`w-full py-2 text-xs font-imperial font-bold tracking-wider uppercase
                  transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                  ${isLong
                    ? 'bg-positive-green text-white hover:bg-positive-green/80'
                    : 'bg-negative-red text-white hover:bg-negative-red/80'
                  }`}
      >
        {isSubmitting ? 'PLACING...' : `PLACE ${side}`}
      </button>
    </div>
  );
}

/**
 * Position visualization overlay for the chart
 * Shows entry, SL, TP levels as horizontal lines with labels
 */
export function PositionOverlay({
  side,
  entryPrice,
  stopLossPrice: _stopLossPrice,
  takeProfitPrice: _takeProfitPrice,
  quantity,
  riskRewardRatio,
  currentPrice,
}: PositionDraft & { currentPrice: number }) {
  const isLong = side === 'LONG';

  // Calculate unrealized P&L
  const pnl = isLong
    ? (currentPrice - entryPrice) * quantity
    : (entryPrice - currentPrice) * quantity;

  const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100 * (isLong ? 1 : -1);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* This would be rendered as SVG overlays on the chart */}
      {/* For now, showing info panel */}
      <div className={`absolute top-2 right-2 bg-container-bg/90 border p-2 text-xs
                      ${isLong ? 'border-positive-green/50' : 'border-negative-red/50'}`}>
        <div className="font-imperial font-bold mb-1">
          Open P&L: <span className={pnl >= 0 ? 'text-positive-green' : 'text-negative-red'}>
            ${pnl.toFixed(2)} ({pnlPercent.toFixed(2)}%)
          </span>
        </div>
        <div className="text-text-secondary">
          Qty: {quantity.toFixed(8)} | R:R: 1:{riskRewardRatio.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
