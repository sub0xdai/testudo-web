import { useEffect, useRef, useCallback } from 'react';

interface LiveModeConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation dialog for enabling live trading mode.
 * Warns user that real orders will be placed on Binance.
 * Includes accessibility features: focus trap, ARIA attributes, keyboard navigation.
 */
export function LiveModeConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
}: LiveModeConfirmDialogProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Handle escape key
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }

      // Focus trap - Tab navigation within modal
      if (event.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    },
    [onCancel]
  );

  // Focus management and keyboard listeners
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;

      // Focus cancel button (safer default)
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 0);

      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';

      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="live-mode-title"
      aria-describedby="live-mode-description"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className="relative bg-container-bg border border-container-border rounded-xl
                   shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-negative-red/20">
            <WarningIcon className="w-6 h-6 text-negative-red" />
          </div>
          <div>
            <h2
              id="live-mode-title"
              className="text-base font-imperial font-semibold tracking-wider uppercase text-text-default"
            >
              Enable Live Trading
            </h2>
          </div>
        </div>

        {/* Warning Message */}
        <div className="bg-negative-red/10 border border-negative-red/30 p-4 mb-6 rounded">
          <p id="live-mode-description" className="text-sm text-text-default leading-relaxed">
            You are about to enable <span className="font-semibold text-negative-red">live trading</span>.
            Real orders will be placed on Binance using your connected API keys.
          </p>
          <p className="text-xs text-text-secondary mt-2">
            Ensure you understand the risks before proceeding.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            className="flex-1 py-3 px-4 font-imperial font-semibold text-xs tracking-wider uppercase
                     bg-container-bg-hover text-text-default
                     hover:bg-container-bg-hover/80
                     focus:outline-none focus:ring-1 focus:ring-steel-primary/50
                     transition-colors duration-150"
            aria-label="Cancel and stay in shadow mode"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 font-imperial font-semibold text-xs tracking-wider uppercase
                     bg-negative-red hover:bg-negative-red-hover text-white
                     focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-offset-container-bg focus:ring-negative-red
                     transition-colors duration-150"
            aria-label="Enable live trading"
          >
            Enable Live Trading
          </button>
        </div>

        {/* Keyboard hint */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-container-bg-hover rounded">Esc</kbd>
            Cancel
          </span>
        </div>
      </div>
    </div>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

export default LiveModeConfirmDialog;
