import { useState, useCallback, useMemo } from 'react';
import { PriceAlert } from '../utils/types';
import { formatUSD } from '../utils/format';

interface PriceAlertsProps {
  currentPrice: number;
  alerts: PriceAlert[];
  onAddAlert: (targetPrice: number, condition: 'above' | 'below') => void;
  onRemoveAlert: (alertId: string) => void;
  onClearTriggered?: () => void;
}

/**
 * Price alerts panel - set and manage price notifications
 */
export function PriceAlerts({
  currentPrice,
  alerts,
  onAddAlert,
  onRemoveAlert,
}: PriceAlertsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) return;

    onAddAlert(price, condition);
    setTargetPrice('');
    setIsAdding(false);
  }, [targetPrice, condition, onAddAlert]);

  const suggestedPrices = useMemo(() => {
    if (currentPrice <= 0) return [];
    const step = currentPrice * 0.01; // 1% increments
    return [
      { price: currentPrice + step * 2, label: '+2%' },
      { price: currentPrice + step * 5, label: '+5%' },
      { price: currentPrice - step * 2, label: '-2%' },
      { price: currentPrice - step * 5, label: '-5%' },
    ];
  }, [currentPrice]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-container-border bg-container-bg-hover/20">
        <div className="flex items-center gap-2">
          <BellIcon className="w-4 h-4 text-text-secondary" />
          <span className="text-xs font-medium text-text-default">Price Alerts</span>
          {alerts.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-interactive-link/20 text-interactive-link rounded-full">
              {alerts.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-1 text-text-secondary hover:text-text-default transition-colors"
          aria-label={isAdding ? 'Cancel' : 'Add alert'}
        >
          {isAdding ? <CloseIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
        </button>
      </div>

      {/* Add Alert Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-3 border-b border-container-border bg-container-bg-hover/10">
          <div className="flex flex-col gap-2">
            {/* Condition Toggle */}
            <div className="flex rounded-lg overflow-hidden border border-container-border">
              <button
                type="button"
                onClick={() => setCondition('above')}
                className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                  condition === 'above'
                    ? 'bg-positive-green/20 text-positive-green'
                    : 'text-text-secondary hover:text-text-default'
                }`}
              >
                Above
              </button>
              <button
                type="button"
                onClick={() => setCondition('below')}
                className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                  condition === 'below'
                    ? 'bg-negative-red/20 text-negative-red'
                    : 'text-text-secondary hover:text-text-default'
                }`}
              >
                Below
              </button>
            </div>

            {/* Price Input */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs">$</span>
              <input
                type="number"
                step="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder={currentPrice.toFixed(2)}
                className="w-full pl-6 pr-3 py-2 bg-container-bg-hover border border-container-border rounded-lg
                         text-text-default text-sm font-numeral
                         focus:outline-none focus:ring-2 focus:ring-interactive-link/50"
              />
            </div>

            {/* Quick Select */}
            <div className="flex gap-1">
              {suggestedPrices.map(({ price, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setTargetPrice(price.toFixed(2));
                    setCondition(price > currentPrice ? 'above' : 'below');
                  }}
                  className="flex-1 py-1 text-[10px] bg-container-bg-hover hover:bg-container-bg-hover/80
                           text-text-secondary rounded transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!targetPrice || parseFloat(targetPrice) <= 0}
              className="w-full py-2 text-xs font-medium bg-interactive-link hover:bg-interactive-link-hover
                       text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Set Alert
            </button>
          </div>
        </form>
      )}

      {/* Alerts List */}
      <div className="flex-1 overflow-auto thin-scroll">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <BellOffIcon className="w-8 h-8 text-text-secondary/50 mb-2" />
            <span className="text-xs text-text-secondary">No active alerts</span>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-2 text-xs text-interactive-link hover:text-interactive-link-hover"
            >
              Create one
            </button>
          </div>
        ) : (
          <div className="divide-y divide-container-border">
            {alerts.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                currentPrice={currentPrice}
                onRemove={() => onRemoveAlert(alert.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface AlertRowProps {
  alert: PriceAlert;
  currentPrice: number;
  onRemove: () => void;
}

function AlertRow({ alert, currentPrice, onRemove }: AlertRowProps) {
  const isAbove = alert.condition === 'above';
  const distance = ((alert.targetPrice - currentPrice) / currentPrice) * 100;
  const distanceAbs = Math.abs(distance);

  return (
    <div className="p-3 hover:bg-container-bg-hover/30 transition-colors group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isAbove ? 'bg-positive-green' : 'bg-negative-red'
            }`}
          />
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-numeral text-text-default">
                {formatUSD(alert.targetPrice)}
              </span>
              <span className={`text-[10px] ${isAbove ? 'text-positive-green' : 'text-negative-red'}`}>
                {isAbove ? '↑' : '↓'} {distanceAbs.toFixed(1)}%
              </span>
            </div>
            <span className="text-[10px] text-text-secondary">
              Alert when {isAbove ? 'above' : 'below'}
            </span>
          </div>
        </div>

        <button
          onClick={onRemove}
          className="p-1 text-text-secondary hover:text-negative-red opacity-0 group-hover:opacity-100 transition-all"
          aria-label="Remove alert"
        >
          <TrashIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// Icons
function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function BellOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      <line x1="3" y1="3" x2="21" y2="21" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

export default PriceAlerts;
