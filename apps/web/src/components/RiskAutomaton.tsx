import { useState, useEffect, useContext, useMemo } from 'react';
import { toast } from 'sonner';
import { TradesContext } from '../state/TradesProvider';
import { TradingModeContext } from '../state/TradingModeProvider';
import { useRiskCalculation } from '../hooks/useRiskCalculation';
import { RiskDisplay } from './RiskDisplay';
import { createOrder, getRiskConfig, RiskConfig } from '../utils/requests';

interface RiskAutomatonProps {
  market: string;
}

type OrderSide = 'LONG' | 'SHORT';

const DEFAULT_ACCOUNT_BALANCE = 10000; // Will be fetched from API in future

/**
 * RiskAutomaton - Position sizing calculator and order submission
 *
 * Calculates position size based on:
 * - Entry price
 * - Stop loss price
 * - Take profit price (optional)
 * - Account risk percentage
 */
export function RiskAutomaton({ market }: RiskAutomatonProps) {
  const { price: currentPrice } = useContext(TradesContext);
  const { mode } = useContext(TradingModeContext);

  const [side, setSide] = useState<OrderSide>('LONG');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [takeProfitPrice, setTakeProfitPrice] = useState('');
  const [riskConfig, setRiskConfig] = useState<RiskConfig | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load risk config on mount
  useEffect(() => {
    loadRiskConfig();
  }, []);

  // Update entry price from market price
  useEffect(() => {
    if (currentPrice && !entryPrice) {
      setEntryPrice(currentPrice);
    }
  }, [currentPrice, entryPrice]);

  const loadRiskConfig = async () => {
    try {
      const config = await getRiskConfig();
      setRiskConfig(config);
    } catch {
      // Use defaults if not authenticated
      setRiskConfig({
        account_risk_percent: '2',
        max_risk_amount: null,
        max_position_size: null,
        max_leverage: 1,
        daily_max_drawdown_percent: '5',
        max_open_positions: 5,
        require_stop_loss: true,
        default_stop_atr_multiplier: '2',
        min_risk_reward_ratio: '1.5',
      });
    }
  };

  const riskPercent = useMemo(() => {
    return parseFloat(riskConfig?.account_risk_percent ?? '2') || 2;
  }, [riskConfig]);

  const maxRiskAmount = useMemo(() => {
    return riskConfig?.max_risk_amount ? parseFloat(riskConfig.max_risk_amount) : undefined;
  }, [riskConfig]);

  const maxPositionSize = useMemo(() => {
    return riskConfig?.max_position_size ? parseFloat(riskConfig.max_position_size) : undefined;
  }, [riskConfig]);

  const calculation = useRiskCalculation({
    entryPrice: parseFloat(entryPrice) || 0,
    stopLossPrice: parseFloat(stopLossPrice) || 0,
    takeProfitPrice: takeProfitPrice ? parseFloat(takeProfitPrice) : undefined,
    accountBalance: DEFAULT_ACCOUNT_BALANCE,
    riskPercent,
    maxRiskAmount,
    maxPositionSize,
  });

  const handleSubmit = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      toast.error('Please log in to place orders');
      return;
    }

    if (!calculation.isValid) {
      toast.error(calculation.validationError || 'Invalid order parameters');
      return;
    }

    if (!stopLossPrice && riskConfig?.require_stop_loss) {
      toast.error('Stop loss is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrder({
        market,
        side: side === 'LONG' ? 'BUY' : 'SELL',
        quantity: calculation.positionSize,
        price: parseFloat(entryPrice) || 0,
        userId,
        executionMode: mode,
      });

      toast.success(`${side} order placed`, {
        description: `${calculation.positionSize} @ ${entryPrice}`,
      });

      // Reset form
      setEntryPrice(currentPrice || '');
      setStopLossPrice('');
      setTakeProfitPrice('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to place order';
      toast.error('Order failed', { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLong = side === 'LONG';

  return (
    <div className="h-full bg-container-bg rounded-xl border border-container-border overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-container-border">
        <h2 className="text-xs font-imperial font-semibold text-text-default uppercase tracking-wider">
          Position Calculator
        </h2>
      </div>

      {/* Side Toggle */}
      <div className="p-3 border-b border-container-border">
        <div className="flex rounded-lg bg-main-bg p-1">
          <button
            onClick={() => setSide('LONG')}
            className={`flex-1 py-2 text-xs font-imperial font-semibold uppercase tracking-wider rounded-md transition-colors ${
              isLong
                ? 'bg-status-success text-main-bg'
                : 'text-text-secondary hover:text-text-default'
            }`}
          >
            Long
          </button>
          <button
            onClick={() => setSide('SHORT')}
            className={`flex-1 py-2 text-xs font-imperial font-semibold uppercase tracking-wider rounded-md transition-colors ${
              !isLong
                ? 'bg-status-error text-main-bg'
                : 'text-text-secondary hover:text-text-default'
            }`}
          >
            Short
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Entry Price */}
        <InputField
          label="Entry Price"
          value={entryPrice}
          onChange={setEntryPrice}
          placeholder={currentPrice || '0'}
        />

        {/* Stop Loss */}
        <InputField
          label="Stop Loss"
          value={stopLossPrice}
          onChange={setStopLossPrice}
          placeholder={isLong ? 'Below entry' : 'Above entry'}
          required={riskConfig?.require_stop_loss}
        />

        {/* Take Profit */}
        <InputField
          label="Take Profit"
          value={takeProfitPrice}
          onChange={setTakeProfitPrice}
          placeholder={isLong ? 'Above entry' : 'Below entry'}
        />

        {/* Risk Display */}
        <RiskDisplay calculation={calculation} side={side} />
      </div>

      {/* Submit Button */}
      <div className="p-3 border-t border-container-border">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !calculation.isValid}
          className={`w-full py-3 text-sm font-imperial font-semibold uppercase tracking-wider rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isLong
              ? 'bg-status-success hover:bg-status-success/90 text-main-bg'
              : 'bg-status-error hover:bg-status-error/90 text-main-bg'
          }`}
        >
          {isSubmitting ? 'Placing Order...' : `${side} ${market}`}
        </button>

        {/* Mode Indicator */}
        <div className="mt-2 text-center">
          <span className={`text-[10px] font-mono uppercase ${
            mode === 'live' ? 'text-status-warning' : 'text-text-tertiary'
          }`}>
            {mode === 'live' ? 'Live Trading' : 'Paper Trading'}
          </span>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="flex items-center gap-1 text-[10px] font-imperial text-text-tertiary uppercase tracking-wider mb-1.5">
        {label}
        {required && <span className="text-status-error">*</span>}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        step="any"
        className="w-full px-3 py-2 bg-main-bg border border-container-border rounded-lg
                   text-text-default font-numeral text-sm text-right
                   placeholder:text-text-tertiary
                   focus:outline-none focus:ring-1 focus:ring-steel-primary/50 focus:border-steel-primary/50
                   transition-colors"
      />
    </div>
  );
}

export default RiskAutomaton;
