import { useContext } from 'react';
import { TradingModeContext } from '../../state/TradingModeProvider';

/**
 * Visual indicator badge showing current trading mode.
 * - Shadow: Green outline, "Shadow" text
 * - Live: Red outline with pulsing dot, "LIVE" text
 */
export function ModeIndicator() {
  const { mode } = useContext(TradingModeContext);
  const isLive = mode === 'live';

  return (
    <div
      className={`
        flex items-center gap-1.5 px-2 py-1 text-[10px] font-imperial font-semibold tracking-wider uppercase
        border rounded transition-colors
        ${isLive
          ? 'border-negative-red text-negative-red'
          : 'border-positive-green text-positive-green'
        }
      `}
      role="status"
      aria-live="polite"
      aria-label={isLive ? 'Live trading mode active' : 'Paper trading mode active'}
    >
      {isLive && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-negative-red opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-negative-red" />
        </span>
      )}
      <span>{isLive ? 'LIVE' : 'Shadow'}</span>
    </div>
  );
}

export default ModeIndicator;
