import { useState, useEffect, useContext } from 'react';
import { toast } from 'sonner';
import { TradingModeContext } from '../state/TradingModeProvider';
import { getRiskConfig, updateRiskConfig, RiskConfig } from '../utils/requests';

/**
 * RiskAutomaton - Risk configuration panel
 *
 * DRAW-08: Converted to config-only panel.
 * Entry/SL/TP and order submission are now handled by PositionDrawingTool.
 *
 * Shows:
 * - Account risk percentage
 * - Max position size cap
 * - Require stop loss toggle
 * - Min risk/reward ratio
 */
export function RiskAutomaton() {
  const { mode } = useContext(TradingModeContext);

  const [riskConfig, setRiskConfig] = useState<RiskConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Editable fields
  const [riskPercent, setRiskPercent] = useState('2');
  const [maxPositionSize, setMaxPositionSize] = useState('');
  const [requireStopLoss, setRequireStopLoss] = useState(true);
  const [minRiskReward, setMinRiskReward] = useState('1.5');

  // Load risk config on mount
  useEffect(() => {
    loadRiskConfig();
  }, []);

  const loadRiskConfig = async () => {
    setIsLoading(true);
    try {
      const config = await getRiskConfig();
      setRiskConfig(config);
      setRiskPercent(config.account_risk_percent);
      setMaxPositionSize(config.max_position_size ?? '');
      setRequireStopLoss(config.require_stop_loss);
      setMinRiskReward(config.min_risk_reward_ratio ?? '1.5');
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await updateRiskConfig({
        account_risk_percent: riskPercent,
        max_position_size: maxPositionSize || null,
        require_stop_loss: requireStopLoss,
        min_risk_reward_ratio: minRiskReward || null,
      });
      setRiskConfig(updated);
      toast.success('Risk settings saved');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save settings';
      toast.error('Save failed', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = riskConfig && (
    riskPercent !== riskConfig.account_risk_percent ||
    (maxPositionSize || null) !== riskConfig.max_position_size ||
    requireStopLoss !== riskConfig.require_stop_loss ||
    (minRiskReward || null) !== riskConfig.min_risk_reward_ratio
  );

  if (isLoading) {
    return (
      <div className="h-full bg-container-bg rounded-xl border border-container-border flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-steel-primary border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full bg-container-bg rounded-xl border border-container-border overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-container-border">
        <h2 className="text-xs font-imperial font-semibold text-text-default uppercase tracking-wider">
          Risk Settings
        </h2>
        <p className="text-[10px] text-text-tertiary mt-1">
          Use Position Tool on chart to place orders
        </p>
      </div>

      {/* Config Fields */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Risk Percent */}
        <div>
          <label className="text-[10px] font-imperial text-text-tertiary uppercase tracking-wider mb-1.5 block">
            Account Risk %
          </label>
          <input
            type="number"
            value={riskPercent}
            onChange={(e) => setRiskPercent(e.target.value)}
            min="0.1"
            max="100"
            step="0.1"
            className="w-full px-3 py-2 bg-main-bg border border-container-border rounded-lg
                       text-text-default font-numeral text-sm text-right
                       focus:outline-none focus:ring-1 focus:ring-steel-primary/50 focus:border-steel-primary/50
                       transition-colors"
          />
          <p className="text-[9px] text-text-tertiary mt-1">
            Max % of account to risk per trade
          </p>
        </div>

        {/* Max Position Size */}
        <div>
          <label className="text-[10px] font-imperial text-text-tertiary uppercase tracking-wider mb-1.5 block">
            Max Position Size
          </label>
          <input
            type="number"
            value={maxPositionSize}
            onChange={(e) => setMaxPositionSize(e.target.value)}
            placeholder="No limit"
            min="0"
            step="any"
            className="w-full px-3 py-2 bg-main-bg border border-container-border rounded-lg
                       text-text-default font-numeral text-sm text-right
                       placeholder:text-text-tertiary
                       focus:outline-none focus:ring-1 focus:ring-steel-primary/50 focus:border-steel-primary/50
                       transition-colors"
          />
          <p className="text-[9px] text-text-tertiary mt-1">
            Cap on position size (optional)
          </p>
        </div>

        {/* Min Risk/Reward */}
        <div>
          <label className="text-[10px] font-imperial text-text-tertiary uppercase tracking-wider mb-1.5 block">
            Min Risk/Reward Ratio
          </label>
          <input
            type="number"
            value={minRiskReward}
            onChange={(e) => setMinRiskReward(e.target.value)}
            placeholder="1.5"
            min="0"
            step="0.1"
            className="w-full px-3 py-2 bg-main-bg border border-container-border rounded-lg
                       text-text-default font-numeral text-sm text-right
                       placeholder:text-text-tertiary
                       focus:outline-none focus:ring-1 focus:ring-steel-primary/50 focus:border-steel-primary/50
                       transition-colors"
          />
          <p className="text-[9px] text-text-tertiary mt-1">
            Minimum R:R for position approval
          </p>
        </div>

        {/* Require Stop Loss */}
        <div className="flex items-center justify-between py-2">
          <div>
            <span className="text-[10px] font-imperial text-text-tertiary uppercase tracking-wider">
              Require Stop Loss
            </span>
            <p className="text-[9px] text-text-tertiary mt-0.5">
              All positions must have SL
            </p>
          </div>
          <button
            onClick={() => setRequireStopLoss(!requireStopLoss)}
            className={`
              w-10 h-5 rounded-full transition-colors relative
              ${requireStopLoss ? 'bg-status-success' : 'bg-container-bg-hover'}
            `}
          >
            <div
              className={`
                absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform
                ${requireStopLoss ? 'translate-x-5' : 'translate-x-0.5'}
              `}
            />
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="p-3 border-t border-container-border">
        <button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="w-full py-2.5 text-xs font-imperial font-semibold uppercase tracking-wider rounded-lg
                     bg-steel-primary hover:bg-steel-primary/90 text-main-bg
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
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

export default RiskAutomaton;
