import { useMemo } from 'react';

export interface RiskCalculationInput {
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice?: number;
  accountBalance: number;
  riskPercent: number;
  maxRiskAmount?: number;
  maxPositionSize?: number;
}

export interface RiskCalculationResult {
  positionSize: number;
  riskAmount: number;
  riskPercent: number;
  profitAmount: number | null;
  profitPercent: number | null;
  riskRewardRatio: number | null;
  stopLossDistance: number;
  takeProfitDistance: number | null;
  isValid: boolean;
  validationError: string | null;
}

/**
 * Calculate position size based on risk parameters
 * Uses fixed fractional position sizing:
 * Position Size = (Account * Risk%) / |Entry - StopLoss|
 */
export function useRiskCalculation(input: RiskCalculationInput): RiskCalculationResult {
  return useMemo(() => {
    const {
      entryPrice,
      stopLossPrice,
      takeProfitPrice,
      accountBalance,
      riskPercent,
      maxRiskAmount,
      maxPositionSize,
    } = input;

    // Validation
    if (entryPrice <= 0) {
      return invalidResult('Entry price must be positive');
    }
    if (stopLossPrice <= 0) {
      return invalidResult('Stop loss price must be positive');
    }
    if (accountBalance <= 0) {
      return invalidResult('Account balance must be positive');
    }
    if (riskPercent <= 0 || riskPercent > 100) {
      return invalidResult('Risk percent must be between 0 and 100');
    }

    // Calculate stop loss distance (absolute value)
    const stopLossDistance = Math.abs(entryPrice - stopLossPrice);

    if (stopLossDistance === 0) {
      return invalidResult('Stop loss cannot equal entry price');
    }

    // Calculate base risk amount from percentage
    let riskAmount = (accountBalance * riskPercent) / 100;

    // Apply max risk amount cap if set
    if (maxRiskAmount && maxRiskAmount > 0) {
      riskAmount = Math.min(riskAmount, maxRiskAmount);
    }

    // Calculate position size: Risk Amount / Stop Loss Distance
    let positionSize = riskAmount / stopLossDistance;

    // Apply max position size cap if set
    if (maxPositionSize && maxPositionSize > 0) {
      positionSize = Math.min(positionSize, maxPositionSize);
    }

    // Recalculate actual risk with final position size
    const actualRiskAmount = positionSize * stopLossDistance;
    const actualRiskPercent = (actualRiskAmount / accountBalance) * 100;

    // Calculate take profit metrics if TP is set
    let takeProfitDistance: number | null = null;
    let profitAmount: number | null = null;
    let profitPercent: number | null = null;
    let riskRewardRatio: number | null = null;

    if (takeProfitPrice && takeProfitPrice > 0) {
      takeProfitDistance = Math.abs(takeProfitPrice - entryPrice);
      profitAmount = positionSize * takeProfitDistance;
      profitPercent = (profitAmount / accountBalance) * 100;

      if (stopLossDistance > 0) {
        riskRewardRatio = takeProfitDistance / stopLossDistance;
      }
    }

    return {
      positionSize: roundToDecimals(positionSize, 6),
      riskAmount: roundToDecimals(actualRiskAmount, 2),
      riskPercent: roundToDecimals(actualRiskPercent, 2),
      profitAmount: profitAmount !== null ? roundToDecimals(profitAmount, 2) : null,
      profitPercent: profitPercent !== null ? roundToDecimals(profitPercent, 2) : null,
      riskRewardRatio: riskRewardRatio !== null ? roundToDecimals(riskRewardRatio, 2) : null,
      stopLossDistance: roundToDecimals(stopLossDistance, 4),
      takeProfitDistance: takeProfitDistance !== null ? roundToDecimals(takeProfitDistance, 4) : null,
      isValid: true,
      validationError: null,
    };
  }, [input]);
}

function invalidResult(error: string): RiskCalculationResult {
  return {
    positionSize: 0,
    riskAmount: 0,
    riskPercent: 0,
    profitAmount: null,
    profitPercent: null,
    riskRewardRatio: null,
    stopLossDistance: 0,
    takeProfitDistance: null,
    isValid: false,
    validationError: error,
  };
}

function roundToDecimals(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export default useRiskCalculation;
