import { useContext, useState, useCallback } from 'react';
import { TradingModeContext, ExecutionMode } from '../../state/TradingModeProvider';
import { LiveModeConfirmDialog } from './LiveModeConfirmDialog';

/**
 * Segmented control for switching between Shadow and Live trading modes.
 * Roman Stoic design: machined segments with pressed/inset active state.
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
        className="flex border-2 border-container-border overflow-hidden bg-main-bg"
        role="radiogroup"
        aria-label="Trading mode selection"
      >
        <ModeButton
          mode="shadow"
          label="SHADOW"
          isActive={mode === 'shadow'}
          onClick={() => handleModeSelect('shadow')}
        />
        {/* Divider between segments */}
        <div className="w-[2px] bg-container-border" />
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

  // Roman Stoic: machined segments, inset active state
  const activeStyles = isShadow
    ? 'bg-container-bg-selected text-positive-green shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]'
    : 'bg-container-bg-selected text-negative-red shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]';

  const inactiveStyles = 'bg-transparent text-text-secondary hover:text-text-default hover:bg-container-bg-hover';

  return (
    <button
      onClick={onClick}
      role="radio"
      aria-checked={isActive}
      aria-label={`${label} trading mode`}
      className={`
        px-4 py-2 font-imperial font-semibold text-[10px] tracking-widest
        transition-all duration-0
        ${isActive ? activeStyles : inactiveStyles}
      `}
    >
      {label}
    </button>
  );
}

export default ModeToggle;
