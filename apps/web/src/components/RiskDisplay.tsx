import { RiskCalculationResult } from '../hooks/useRiskCalculation';

interface RiskDisplayProps {
  calculation: RiskCalculationResult;
  side: 'LONG' | 'SHORT';
}

/**
 * Displays calculated risk metrics for a trade
 */
export function RiskDisplay({ calculation, side }: RiskDisplayProps) {
  const {
    positionSize,
    riskAmount,
    riskPercent,
    profitAmount,
    profitPercent,
    riskRewardRatio,
    isValid,
    validationError,
  } = calculation;

  if (!isValid && validationError) {
    return (
      <div className="p-3 bg-status-warning/10 border border-status-warning/30 rounded-lg">
        <p className="text-xs text-status-warning font-mono">{validationError}</p>
      </div>
    );
  }

  const sideColor = side === 'LONG' ? 'text-status-success' : 'text-status-error';

  return (
    <div className="space-y-3">
      {/* Position Size - Primary metric */}
      <div className="p-3 bg-main-bg rounded-lg border border-container-border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-imperial text-text-secondary uppercase tracking-wider">
            Position Size
          </span>
          <span className={`text-lg font-numeral font-bold ${sideColor}`}>
            {formatNumber(positionSize, 6)}
          </span>
        </div>
      </div>

      {/* Risk/Reward Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Risk */}
        <div className="p-2.5 bg-main-bg rounded-lg border border-container-border">
          <div className="text-[10px] font-imperial text-text-tertiary uppercase tracking-wider mb-1">
            Risk
          </div>
          <div className="text-sm font-numeral text-status-error">
            ${formatNumber(riskAmount, 2)}
          </div>
          <div className="text-xs font-numeral text-text-tertiary">
            {formatNumber(riskPercent, 2)}%
          </div>
        </div>

        {/* Profit */}
        <div className="p-2.5 bg-main-bg rounded-lg border border-container-border">
          <div className="text-[10px] font-imperial text-text-tertiary uppercase tracking-wider mb-1">
            Profit
          </div>
          <div className="text-sm font-numeral text-status-success">
            {profitAmount !== null ? `$${formatNumber(profitAmount, 2)}` : '-'}
          </div>
          <div className="text-xs font-numeral text-text-tertiary">
            {profitPercent !== null ? `${formatNumber(profitPercent, 2)}%` : '-'}
          </div>
        </div>
      </div>

      {/* R:R Ratio */}
      {riskRewardRatio !== null && (
        <div className="flex items-center justify-between px-3 py-2 bg-main-bg rounded-lg border border-container-border">
          <span className="text-xs font-imperial text-text-secondary uppercase tracking-wider">
            Risk : Reward
          </span>
          <span className={`text-sm font-numeral font-semibold ${
            riskRewardRatio >= 2 ? 'text-status-success' :
            riskRewardRatio >= 1 ? 'text-status-warning' :
            'text-status-error'
          }`}>
            1 : {formatNumber(riskRewardRatio, 2)}
          </span>
        </div>
      )}
    </div>
  );
}

function formatNumber(value: number, decimals: number): string {
  if (value === 0) return '0';
  if (value < 0.0001) return value.toExponential(2);
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export default RiskDisplay;
