import { useState, useEffect, useContext, useMemo, useCallback, useRef } from "react";
import { createOrder } from "../utils/requests";
import { CreateOrder } from "../utils/types";
import { toast } from "sonner";
import { TradesContext } from "../state/TradesProvider";
import { formatUSD, formatQuantity, parseMarketSymbol } from "../utils/format";
import { Skeleton } from "./ui/Skeleton";
import { BalanceDisplay } from "./ui/BalanceDisplay";
import { TradeConfirmationModal } from "./ui/TradeConfirmationModal";
import { useKeyboardShortcuts, TRADING_SHORTCUTS } from "../hooks/useKeyboardShortcuts";

const LARGE_ORDER_THRESHOLD = 1000; // USD threshold for confirmation modal
const DEV_FALLBACK_PRICE = 200; // Fallback price for testing when backend unavailable

type OrderSide = 'BUY' | 'SELL';
type OrderType = 'Limit' | 'Market';

interface SwapInterfaceProps {
  market: string;
}

export const SwapInterface = ({ market }: SwapInterfaceProps) => {
  const { price, isSubmitting, setIsSubmitting, setError, loading } = useContext(TradesContext);
  // Use fallback price for testing when backend is unavailable
  const currentPrice = useMemo(() => {
    const backendPrice = parseFloat(price ?? "0");
    return backendPrice > 0 ? backendPrice : DEV_FALLBACK_PRICE;
  }, [price]);

  const { base, quote } = useMemo(() => parseMarketSymbol(market), [market]);

  const [orderSide, setOrderSide] = useState<OrderSide>("BUY");
  const [orderType, setOrderType] = useState<OrderType>("Limit");
  const [limitPrice, setLimitPrice] = useState<string>("");
  const [size, setSize] = useState<string>("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const sizeInputRef = useRef<HTMLInputElement>(null);

  const isBuyMode = orderSide === "BUY";

  // Clear form function for Escape shortcut
  const clearForm = useCallback(() => {
    setSize("");
    setLimitPrice("");
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
    const calculatedFees = calculatedValue * 0.001;

    return {
      maxUSD: calculatedValue,
      fees: calculatedFees,
      position: sizeValue,
    };
  }, [size, limitPrice, orderType, currentPrice]);

  // Handle USD input change
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

  // Execute the actual order submission
  const executeOrder = useCallback(async () => {
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

      setSize("");
      setShowConfirmModal(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create order";
      setError('submission', errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [size, limitPrice, orderType, currentPrice, market, orderSide, base, setIsSubmitting, setError]);

  // Handle order button click
  const handleCreateOrder = useCallback(async () => {
    const validationError = validateOrder();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (maxUSD >= LARGE_ORDER_THRESHOLD) {
      setShowConfirmModal(true);
      return;
    }

    await executeOrder();
  }, [validateOrder, maxUSD, executeOrder]);

  const handleConfirmOrder = useCallback(async () => {
    await executeOrder();
  }, [executeOrder]);

  const handleCancelConfirmation = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

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
        toast.info("Acquire mode", { duration: 1500 });
      },
    },
    {
      ...TRADING_SHORTCUTS.SELL,
      handler: () => {
        setOrderSide("SELL");
        sizeInputRef.current?.focus();
        toast.info("Liquidate mode", { duration: 1500 });
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
      {/* Legionary Panel */}
      <div className="h-full panel-imperial overflow-hidden">
        <div className="p-5 relative flex flex-col h-full overflow-auto thin-scroll justify-start">
          {/* Panel Title */}
          <h2 className="imperial-header text-sm mb-5 text-center text-steel-primary">
            Execute Order
          </h2>

          <div className="flex flex-col h-full justify-start gap-5">
            {/* ACQUIRE / LIQUIDATE Toggle */}
            <div
              className="flex border border-steel-dim overflow-hidden"
              role="group"
              aria-label="Order side selection"
            >
              <ImperialSideButton
                side="BUY"
                label="ACQUIRE"
                isActive={isBuyMode}
                onClick={() => setOrderSide("BUY")}
              />
              <ImperialSideButton
                side="SELL"
                label="LIQUIDATE"
                isActive={!isBuyMode}
                onClick={() => setOrderSide("SELL")}
              />
            </div>

            {/* Order Type Select */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="orderType"
                className="imperial-inscription text-[10px] tracking-widest"
              >
                ORDER TYPE
              </label>
              <select
                id="orderType"
                className="w-full py-2 bg-transparent border-b border-steel-dim
                         text-text-default text-sm font-numeral
                         focus:border-steel-primary transition-colors cursor-pointer"
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as OrderType)}
              >
                <option value="Limit" className="bg-container-bg">Limit</option>
                <option value="Market" className="bg-container-bg">Market</option>
              </select>
            </div>

            {/* Price Input - Inscription Style */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="limitPrice"
                className="imperial-inscription text-[10px] tracking-widest"
              >
                {orderType === "Limit" ? "LIMIT PRICE" : "MARKET PRICE"}
              </label>

              {orderType === "Limit" ? (
                <div className="relative">
                  <input
                    id="limitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    aria-label={`Limit price in ${quote}`}
                    className="input-imperial w-full pr-12 text-lg"
                    placeholder="0.00"
                  />
                  <span className="absolute right-0 bottom-3 text-steel-dim text-xs font-imperial tracking-wider">
                    {quote}
                  </span>
                </div>
              ) : (
                <div className="py-3 border-b border-steel-dim text-lg font-numeral text-text-default">
                  {isLoading ? (
                    <Skeleton variant="text" width={100} height={24} />
                  ) : (
                    formatUSD(currentPrice)
                  )}
                </div>
              )}
            </div>

            {/* Size and Total - Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Size Input */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="orderSize"
                  className="imperial-inscription text-[10px] tracking-widest"
                >
                  QUANTITY
                </label>
                <div className="relative">
                  <input
                    id="orderSize"
                    ref={sizeInputRef}
                    type="number"
                    step="0.001"
                    min="0"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    aria-label={`Order size in ${base}`}
                    aria-required="true"
                    className="input-imperial w-full pr-10 text-lg"
                    placeholder="0.00"
                  />
                  <span className="absolute right-0 bottom-3 text-steel-dim text-xs font-imperial tracking-wider">
                    {base}
                  </span>
                </div>
              </div>

              {/* Total Value */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="orderTotal"
                  className="imperial-inscription text-[10px] tracking-widest"
                >
                  TOTAL VALUE
                </label>
                <div className="relative">
                  <input
                    id="orderTotal"
                    type="number"
                    step="0.01"
                    min="0"
                    value={maxUSD > 0 ? maxUSD.toFixed(2) : ""}
                    onChange={(e) => handleUSDChange(e.target.value)}
                    aria-label={`Total order value in ${quote}`}
                    className="input-imperial w-full pr-12 text-lg"
                    placeholder="0.00"
                  />
                  <span className="absolute right-0 bottom-3 text-steel-dim text-xs font-imperial tracking-wider">
                    {quote}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Summary - Imperial Divider */}
            <div className="divider-imperial my-2" />

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary tracking-wide">TRIBUTE (0.1%)</span>
                <span className="text-steel-primary font-numeral">{formatUSD(fees)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-secondary tracking-wide">POSITION</span>
                <span className="text-text-default font-numeral">
                  {formatQuantity(position)} {base}
                </span>
              </div>
            </div>

            {/* Balance Display */}
            <div className="divider-imperial my-2" />
            <BalanceDisplay market={market} currentPrice={currentPrice} />

            {/* Execute Button - Metallic Gradient */}
            <button
              onClick={handleCreateOrder}
              disabled={!isFormValid || isSubmitting}
              className={`
                w-full py-4 px-4 font-imperial font-semibold text-sm tracking-widest
                transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed
                ${isBuyMode
                  ? "btn-acquire"
                  : "btn-liquidate"
                }
              `}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner />
                  EXECUTING...
                </span>
              ) : (
                <span>
                  {isBuyMode ? "ACQUIRE" : "LIQUIDATE"} {base}
                </span>
              )}
            </button>

            {/* Keyboard Shortcuts */}
            <KeyboardShortcutsHint />
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <TradeConfirmationModal
        isOpen={showConfirmModal}
        order={{
          side: orderSide,
          baseAsset: base,
          quoteAsset: quote,
          quantity: parseFloat(size) || 0,
          price: orderType === "Market" ? currentPrice : parseFloat(limitPrice) || 0,
          total: maxUSD,
          fees: fees,
        }}
        onConfirm={handleConfirmOrder}
        onCancel={handleCancelConfirmation}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

/**
 * Legionary side toggle button (ACQUIRE / LIQUIDATE)
 */
function ImperialSideButton({
  side,
  label,
  isActive,
  onClick,
}: {
  side: OrderSide;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const isBuy = side === "BUY";

  return (
    <button
      onClick={onClick}
      role="radio"
      aria-checked={isActive}
      aria-label={`${label} order`}
      className={`
        flex-1 py-3 font-imperial font-semibold text-xs tracking-widest
        transition-all duration-150
        ${isActive
          ? isBuy
            ? "bg-metallic-green text-text-emphasis"
            : "bg-metallic-red text-text-emphasis"
          : "bg-transparent text-text-secondary hover:text-steel-primary hover:bg-charcoal"
        }
      `}
    >
      {label}
    </button>
  );
}

/**
 * Loading spinner with steel color
 */
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-steel-primary"
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
 * Keyboard shortcuts hint - Imperial style
 */
function KeyboardShortcutsHint() {
  return (
    <div className="hidden sm:flex items-center justify-center gap-4 pt-3 text-[9px] text-text-tertiary tracking-wider">
      <span className="flex items-center gap-1.5">
        <kbd className="px-1.5 py-0.5 border border-steel-dim text-steel-dim">^B</kbd>
        ACQUIRE
      </span>
      <span className="flex items-center gap-1.5">
        <kbd className="px-1.5 py-0.5 border border-steel-dim text-steel-dim">^S</kbd>
        LIQUIDATE
      </span>
      <span className="flex items-center gap-1.5">
        <kbd className="px-1.5 py-0.5 border border-steel-dim text-steel-dim">ESC</kbd>
        CLEAR
      </span>
    </div>
  );
}
