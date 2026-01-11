import { useContext, useState, useCallback } from 'react';
import { TradingModeContext, ExecutionMode } from '../../state/TradingModeProvider';
import { LiveModeConfirmDialog } from './LiveModeConfirmDialog';

/**
 * Segmented control for switching between Shadow and Live trading modes.
 * Follows the Imperial Roman design pattern from SwapInterface.
 * Shows confirmation dialog when switching to Live mode.
 */
export function ModeToggle() {
  const { mode, setMode } = useContext(TradingModeContext);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleModeSelect = useCallback((selectedMode: ExecutionMode) => {
    if (selectedMode === 'live' && mode !== 'live') {
      // Switching TO live mode - show confirmation
      setShowConfirmDialog(true);
    } else if (selectedMode === 'shadow') {
      // Switching to shadow - no confirmation needed
      setMode('shadow');
    }
  }, [mode, setMode]);

  const handleConfirmLive = useCallback(() => {
    setMode('live');
    setShowConfirmDialog(false);
  }, [setMode]);

  const handleCancelLive = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  return (
    <>
      <div
        className="flex border border-steel-dim overflow-hidden"
        role="radiogroup"
        aria-label="Trading mode selection"
      >
        <ModeButton
          mode="shadow"
          label="SHADOW"
          isActive={mode === 'shadow'}
          onClick={() => handleModeSelect('shadow')}
        />
        <ModeButton
          mode="live"
          label="LIVE"
          isActive={mode === 'live'}
          onClick={() => handleModeSelect('live')}
        />
      </div>

      <LiveModeConfirmDialog
        isOpen={showConfirmDialog}
        onConfirm={handleConfirmLive}
        onCancel={handleCancelLive}
      />
    </>
  );
}

interface ModeButtonProps {
  mode: ExecutionMode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function ModeButton({ mode, label, isActive, onClick }: ModeButtonProps) {
  const isShadow = mode === 'shadow';

  return (
    <button
      onClick={onClick}
      role="radio"
      aria-checked={isActive}
      aria-label={`${label} trading mode`}
      className={`
        px-3 py-1.5 font-imperial font-semibold text-[10px] tracking-widest
        transition-all duration-150
        ${isActive
          ? isShadow
            ? 'bg-positive-green/20 text-positive-green'
            : 'bg-negative-red/20 text-negative-red'
          : 'bg-transparent text-text-secondary hover:text-steel-primary hover:bg-charcoal'
        }
      `}
    >
      {label}
    </button>
  );
}

export default ModeToggle;
