/**
 * Number formatting utilities for trading UI
 * Provides consistent formatting across all components
 */

/**
 * Format a price value with appropriate decimal places
 * Handles different price magnitudes (BTC vs shitcoins)
 */
export function formatPrice(
  value: number | string | undefined | null,
  options: { decimals?: number; symbol?: string } = {}
): string {
  if (value === undefined || value === null || value === '') {
    return '—';
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return '—';
  }

  const { decimals = 2, symbol = '' } = options;

  // Smart decimal places based on magnitude
  let effectiveDecimals = decimals;
  if (num < 0.01) {
    effectiveDecimals = 6;
  } else if (num < 1) {
    effectiveDecimals = 4;
  } else if (num < 100) {
    effectiveDecimals = 2;
  }

  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: effectiveDecimals,
    maximumFractionDigits: effectiveDecimals,
  });

  return symbol ? `${symbol}${formatted}` : formatted;
}

/**
 * Format USD values with $ symbol
 */
export function formatUSD(value: number | string | undefined | null): string {
  return formatPrice(value, { symbol: '$', decimals: 2 });
}

/**
 * Format quantity/size values
 */
export function formatQuantity(
  value: number | string | undefined | null,
  options: { decimals?: number; asset?: string } = {}
): string {
  if (value === undefined || value === null || value === '') {
    return '—';
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return '—';
  }

  const { decimals = 4, asset = '' } = options;

  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });

  return asset ? `${formatted} ${asset}` : formatted;
}

/**
 * Format percentage change with + or - prefix and color indicator
 */
export function formatPercentChange(
  value: number | string | undefined | null
): { text: string; isPositive: boolean; isNegative: boolean } {
  if (value === undefined || value === null || value === '') {
    return { text: '—', isPositive: false, isNegative: false };
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return { text: '—', isPositive: false, isNegative: false };
  }

  const isPositive = num > 0;
  const isNegative = num < 0;
  const prefix = isPositive ? '+' : '';
  const text = `${prefix}${num.toFixed(2)}%`;

  return { text, isPositive, isNegative };
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatCompact(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') {
    return '—';
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return '—';
  }

  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }

  return num.toFixed(2);
}

/**
 * Format a timestamp to local time string
 */
export function formatTime(timestamp: number | Date): string {
  const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Parse a market symbol into base and quote assets
 */
export function parseMarketSymbol(symbol: string): { base: string; quote: string } {
  const [base, quote] = symbol.split('_');
  return { base: base || '', quote: quote || '' };
}
