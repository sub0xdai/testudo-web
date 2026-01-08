import { useState, useEffect, useContext, useMemo, useCallback, useRef } from "react";
import { createOrder } from "../utils/requests";
import { CreateOrder } from "../utils/types";
import { toast } from "sonner";
import { TradesContext } from "../state/TradesProvider";
import { formatUSD, formatQuantity, parseMarketSymbol } from "../utils/format";
import { Skeleton } from "./ui/Skeleton";
import { BalanceDisplay } from "./ui/BalanceDisplay";
import { useKeyboardShortcuts, TRADING_SHORTCUTS } from "../hooks/useKeyboardShortcuts";

type OrderSide = 'BUY' | 'SELL';
type OrderType = 'Limit' | 'Market';

interface SwapInterfaceProps {
  market: string;
}

export const SwapInterface = ({ market }: SwapInterfaceProps) => {
  const { price, isSubmitting, setIsSubmitting, setError, loading } = useContext(TradesContext);
  const currentPrice = useMemo(() => parseFloat(price ?? "0"), [price]);

  const { base, quote } = useMemo(() => parseMarketSymbol(market), [market]);

  const [orderSide, setOrderSide] = useState<OrderSide>("BUY");
  const [orderType, setOrderType] = useState<OrderType>("Limit");
  const [limitPrice, setLimitPrice] = useState<string>("");
  const [size, setSize] = useState<string>("");

  const sizeInputRef = useRef<HTMLInputElement>(null);

  const isBuyMode = orderSide === "BUY";

  // Clear form function for Escape shortcut
  const clearForm = useCallback(() => {
    setSize("");
    setLimitPrice("");
    // Blur any focused input
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    toast.info("Form cleared");
  }, []);

  // Sync limit price with current market price when it changes
  useEffect(() => {
    if (currentPrice > 0 && !limitPrice) {
      setLimitPrice(currentPrice.toFixed(2));
    }
  }, [currentPrice, limitPrice]);

  // Calculate derived values
  const { maxUSD, fees, position } = useMemo(() => {
    const priceValue = orderType === "Market" ? currentPrice : parseFloat(limitPrice) || 0;
    const sizeValue = parseFloat(size) || 0;
    const calculatedValue = priceValue * sizeValue;
    const calculatedFees = calculatedValue * 0.001; // 0.1% fees

    return {
      maxUSD: calculatedValue,
      fees: calculatedFees,
      position: sizeValue,
    };
  }, [size, limitPrice, orderType, currentPrice]);

  // Handle USD input change - calculate size from USD
  const handleUSDChange = useCallback((value: string) => {
    const usdValue = parseFloat(value) || 0;
    const priceValue = orderType === "Market" ? currentPrice : parseFloat(limitPrice) || 0;

    if (priceValue > 0) {
      const newSize = usdValue / priceValue;
      setSize(newSize > 0 ? newSize.toFixed(6) : "");
    }
  }, [orderType, currentPrice, limitPrice]);

  // Validate order before submission
  const validateOrder = useCallback((): string | null => {
    const quantity = parseFloat(size);

    if (!quantity || quantity <= 0) {
      return "Please enter a valid size greater than zero.";
    }

    if (orderType === "Limit") {
      const price = parseFloat(limitPrice);
      if (!price || price <= 0) {
        return "Please enter a valid limit price.";
      }
    }

    if (orderType === "Market" && currentPrice <= 0) {
      return "Market price unavailable. Please try again.";
    }

    return null;
  }, [size, limitPrice, orderType, currentPrice]);

  const handleCreateOrder = useCallback(async () => {
    const validationError = validateOrder();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const quantity = parseFloat(size);
    const orderPrice = orderType === "Market" ? currentPrice : parseFloat(limitPrice);

    const order: CreateOrder = {
      market,
      side: orderSide,
      quantity,
      price: orderPrice,
      userId: localStorage.getItem("user_id") ?? "anonymous",
    };

    try {
      setIsSubmitting(true);
      setError('submission', null);

      await createOrder(order);

      toast.success(
        `${orderSide} order placed: ${formatQuantity(quantity)} ${base} @ ${formatUSD(orderPrice)}`,
        { duration: 5000 }
      );

      // Reset form on success
      setSize("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create order";
      setError('submission', errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateOrder, size, limitPrice, orderType, currentPrice, market, orderSide, base, setIsSubmitting, setError]);

  const isFormValid = useMemo(() => {
    return validateOrder() === null;
  }, [validateOrder]);

  const isLoading = loading.ticker && !price;

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...TRADING_SHORTCUTS.BUY,
      handler: () => {
        setOrderSide("BUY");
        sizeInputRef.current?.focus();
        toast.info("Buy mode", { duration: 1500 });
      },
    },
    {
      ...TRADING_SHORTCUTS.SELL,
      handler: () => {
        setOrderSide("SELL");
        sizeInputRef.current?.focus();
        toast.info("Sell mode", { duration: 1500 });
      },
    },
    {
      ...TRADING_SHORTCUTS.CANCEL,
      handler: clearForm,
    },
    {
      ...TRADING_SHORTCUTS.SUBMIT,
      handler: () => {
        if (isFormValid && !isSubmitting) {
          handleCreateOrder();
        }
      },
    },
  ]);

  return (
    <div className="h-fit lg:h-[600px]">
      <div className="h-full bg-container-bg border-container-border rounded-xl border overflow-hidden">
        <div className="p-4 relative flex flex-col h-full overflow-auto thin-scroll justify-start">
          <div className="flex flex-col h-full justify-start gap-4">
            {/* Buy/Sell Toggle */}
            <div className="flex rounded-xl overflow-hidden border border-container-border">
              <SideButton
                side="BUY"
                isActive={isBuyMode}
                onClick={() => setOrderSide("BUY")}
              />
              <SideButton
                side="SELL"
                isActive={!isBuyMode}
                onClick={() => setOrderSide("SELL")}
              />
            </div>

            {/* Order Type Select */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="orderType"
                className="text-text-secondary text-xs font-semibold tracking-wide"
              >
                Order Type
              </label>
              <select
                id="orderType"
                className="px-3 py-2 bg-container-bg-hover border border-container-border rounded-lg
                         text-text-default text-sm focus:outline-none focus:ring-2 focus:ring-interactive-link/50
                         transition-colors duration-150"
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as OrderType)}
              >
                <option value="Limit">Limit</option>
                <option value="Market">Market</option>
              </select>
            </div>

            {/* Price Input */}
            <div className="flex flex-col gap-2">
              <label className="text-text-secondary text-xs font-semibold tracking-wide">
                {orderType === "Limit" ? "Limit Price" : "Market Price"}
              </label>

              {orderType === "Limit" ? (
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    className="w-full px-3 py-2 pr-12 bg-container-bg-hover border border-container-border rounded-lg
                             text-text-default text-sm font-numeral
                             focus:outline-none focus:ring-2 focus:ring-interactive-link/50
                             transition-colors duration-150"
                    placeholder="0.00"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs">
                    {quote}
                  </span>
                </div>
              ) : (
                <div className="px-3 py-2 bg-container-bg-hover/50 border border-container-border rounded-lg
                              text-text-default text-sm font-numeral">
                  {isLoading ? (
                    <Skeleton variant="text" width={80} height={16} />
                  ) : (
                    formatUSD(currentPrice)
                  )}
                </div>
              )}
            </div>

            {/* Size and USD Value */}
            <div className="grid grid-cols-2 gap-3">
              {/* Size Input */}
              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-xs font-semibold tracking-wide">
                  Size
                </label>
                <div className="relative">
                  <input
                    ref={sizeInputRef}
                    type="number"
                    step="0.001"
                    min="0"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full px-3 py-2 pr-12 bg-container-bg-hover border border-container-border rounded-lg
                             text-text-default text-sm font-numeral
                             focus:outline-none focus:ring-2 focus:ring-interactive-link/50
                             transition-colors duration-150"
                    placeholder="0.00"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <img
                      src={`/${base.toLowerCase()}.svg`}
                      alt={base}
                      className="w-4 h-4 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* USD Value */}
              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-xs font-semibold tracking-wide">
                  Total
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={maxUSD > 0 ? maxUSD.toFixed(2) : ""}
                    onChange={(e) => handleUSDChange(e.target.value)}
                    className="w-full px-3 py-2 pr-12 bg-container-bg-hover border border-container-border rounded-lg
                             text-text-default text-sm font-numeral
                             focus:outline-none focus:ring-2 focus:ring-interactive-link/50
                             transition-colors duration-150"
                    placeholder="0.00"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <img
                      src={`/${quote.toLowerCase()}.svg`}
                      alt={quote}
                      className="w-4 h-4 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="flex flex-col gap-2 py-3 border-t border-container-border">
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Fees (0.1%)</span>
                <span className="text-text-default font-numeral">{formatUSD(fees)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary">Position</span>
                <span className="text-text-default font-numeral">
                  {formatQuantity(position)} {base}
                </span>
              </div>
            </div>

            {/* Balance Display */}
            <div className="py-3 border-t border-container-border">
              <BalanceDisplay market={market} currentPrice={currentPrice} />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleCreateOrder}
              disabled={!isFormValid || isSubmitting}
              className={`
                w-full py-3 px-4 rounded-xl font-semibold text-sm
                transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-container-bg
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isBuyMode
                  ? "bg-positive-green hover:bg-positive-green-hover text-black focus:ring-positive-green"
                  : "bg-negative-red hover:bg-negative-red-hover text-white focus:ring-negative-red"
                }
              `}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner />
                  Processing...
                </span>
              ) : (
                <span>
                  {isBuyMode ? "Buy" : "Sell"} {base}
                </span>
              )}
            </button>

            {/* Keyboard Shortcuts Hint */}
            <KeyboardShortcutsHint />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Buy/Sell side toggle button
 */
function SideButton({
  side,
  isActive,
  onClick,
}: {
  side: OrderSide;
  isActive: boolean;
  onClick: () => void;
}) {
  const isBuy = side === "BUY";

  return (
    <button
      onClick={onClick}
      className={`
        flex-1 py-2.5 font-semibold text-sm transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-inset
        ${isActive
          ? isBuy
            ? "bg-positive-green text-black focus:ring-positive-green-hover"
            : "bg-negative-red text-white focus:ring-negative-red-hover"
          : "bg-transparent text-text-secondary hover:text-text-default hover:bg-container-bg-hover"
        }
      `}
    >
      {isBuy ? "Buy" : "Sell"}
    </button>
  );
}

/**
 * Simple loading spinner
 */
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

/**
 * Keyboard shortcuts hint (hidden on mobile)
 */
function KeyboardShortcutsHint() {
  return (
    <div className="hidden sm:flex items-center justify-center gap-3 pt-2 text-[10px] text-text-secondary">
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-container-bg-hover rounded text-text-default">Ctrl+B</kbd>
        Buy
      </span>
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-container-bg-hover rounded text-text-default">Ctrl+S</kbd>
        Sell
      </span>
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-container-bg-hover rounded text-text-default">Esc</kbd>
        Clear
      </span>
    </div>
  );
}
