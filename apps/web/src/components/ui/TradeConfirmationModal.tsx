import { useEffect, useRef, useCallback } from 'react';
import { formatUSD, formatQuantity } from '../../utils/format';

interface OrderDetails {
  side: 'BUY' | 'SELL';
  baseAsset: string;
  quoteAsset: string;
  quantity: number;
  price: number;
  total: number;
  fees: number;
}

interface TradeConfirmationModalProps {
  isOpen: boolean;
  order: OrderDetails;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

/**
 * Modal dialog for confirming large trades (over $1000)
 * Includes accessibility features: focus trap, ARIA attributes, keyboard navigation
 */
export function TradeConfirmationModal({
  isOpen,
  order,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: TradeConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  const isBuy = order.side === 'BUY';

  // Handle escape key
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
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
    [onCancel, isSubmitting]
  );

  // Focus management and keyboard listeners
  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      previousActiveElement.current = document.activeElement;

      // Focus the confirm button when modal opens
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 0);

      // Add keyboard listener
      document.addEventListener('keydown', handleKeyDown);

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';

      // Restore focus to previously focused element
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
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isSubmitting ? onCancel : undefined}
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
          <div
            className={`p-2 rounded-full ${
              isBuy ? 'bg-positive-green/20' : 'bg-negative-red/20'
            }`}
          >
            <WarningIcon
              className={`w-6 h-6 ${
                isBuy ? 'text-positive-green' : 'text-negative-red'
              }`}
            />
          </div>
          <div>
            <h2
              id="modal-title"
              className="text-base font-imperial font-semibold tracking-wider uppercase text-text-default"
            >
              Confirm Large Order
            </h2>
            <p id="modal-description" className="text-xs text-text-secondary mt-1">
              This order exceeds $1,000. Please review before confirming.
            </p>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-container-bg-hover/30 border border-container-border p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span
              className={`text-[10px] font-imperial font-semibold tracking-wider uppercase px-2 py-1 ${
                isBuy
                  ? 'bg-positive-green/20 text-positive-green'
                  : 'bg-negative-red/20 text-negative-red'
              }`}
            >
              {order.side}
            </span>
            <span className="text-xs text-text-secondary font-imperial tracking-wider">
              {order.baseAsset}/{order.quoteAsset}
            </span>
          </div>

          <div className="space-y-2">
            <DetailRow
              label="Quantity"
              value={`${formatQuantity(order.quantity)} ${order.baseAsset}`}
            />
            <DetailRow
              label="Price"
              value={formatUSD(order.price)}
            />
            <div className="border-t border-container-border pt-2 mt-2">
              <DetailRow
                label="Fees (0.1%)"
                value={formatUSD(order.fees)}
                muted
              />
              <DetailRow
                label="Total"
                value={formatUSD(order.total)}
                highlight
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 font-imperial font-semibold text-xs tracking-wider uppercase
                     bg-container-bg-hover text-text-default
                     hover:bg-container-bg-hover/80
                     focus:outline-none focus:ring-1 focus:ring-steel-primary/50
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-150"
            aria-label="Cancel order"
          >
            Cancel
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`flex-1 py-3 px-4 font-imperial font-semibold text-xs tracking-wider uppercase
                     focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-offset-container-bg
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-150
                     ${
                       isBuy
                         ? 'bg-positive-green hover:bg-positive-green-hover text-black focus:ring-positive-green'
                         : 'bg-negative-red hover:bg-negative-red-hover text-white focus:ring-negative-red'
                     }`}
            aria-label={`Confirm ${order.side.toLowerCase()} order`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner />
                Confirming...
              </span>
            ) : (
              `Confirm ${order.side}`
            )}
          </button>
        </div>

        {/* Keyboard hint */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-container-bg-hover rounded">Enter</kbd>
            Confirm
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-container-bg-hover rounded">Esc</kbd>
            Cancel
          </span>
        </div>
      </div>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
}

function DetailRow({ label, value, highlight = false, muted = false }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-[10px] font-imperial tracking-wider uppercase ${muted ? 'text-text-secondary/70' : 'text-text-secondary'}`}>
        {label}
      </span>
      <span
        className={`text-xs font-numeral ${
          highlight
            ? 'text-text-default font-semibold'
            : muted
            ? 'text-text-secondary/70'
            : 'text-text-default'
        }`}
      >
        {value}
      </span>
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

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default TradeConfirmationModal;
