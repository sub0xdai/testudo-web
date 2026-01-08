import { Navigate, useParams } from "react-router-dom";
import { MarketBar } from "../components/MarketBar";
import { NetBar } from "../components/NetBar";
import { SwapInterface } from "../components/SwapInterface";
import { TradeInterface } from "../components/TradeInterface";
import { OpenOrders } from "../components/OpenOrders";
import { OrderHistory } from "../components/OrderHistory";
import { PriceAlerts } from "../components/PriceAlerts";
import { useEffect, useCallback, useState, useContext } from "react";
import { createUser } from "../utils/requests";
import { ConnectionBadge } from "../components/ui/ConnectionStatus";
import { usePriceAlerts } from "../hooks/usePriceAlerts";
import { TradesContext } from "../state/TradesProvider";

type OrdersTab = 'open' | 'history' | 'alerts';

// Valid markets
const VALID_MARKETS = ['SOL_USDC', 'BTC_USDC', 'ETH_USDC'];

export const Trade = () => {
  const { market } = useParams();
  const [ordersTab, setOrdersTab] = useState<OrdersTab>('open');
  const { price } = useContext(TradesContext);

  const currentPrice = parseFloat(price ?? '0');
  const validMarket = market && VALID_MARKETS.includes(market) ? market : 'SOL_USDC';

  // Price alerts
  const {
    alerts,
    addAlert,
    removeAlert,
    clearTriggered,
  } = usePriceAlerts(currentPrice, validMarket);

  // Initialize user on mount
  const initializeUser = useCallback(async () => {
    const existingUserId = localStorage.getItem("user_id");

    // Only create a new user if we don't have one
    if (!existingUserId || existingUserId === "null" || existingUserId === "undefined") {
      try {
        const user = await createUser();
        if (user?.user_id) {
          localStorage.setItem("user_id", user.user_id);
        }
      } catch {
        // Silently fail - user will be created on order submission if needed
      }
    }
  }, []);

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  // Redirect invalid markets to default
  if (!market || !VALID_MARKETS.includes(market)) {
    return <Navigate to="/trade/SOL_USDC" replace />;
  }

  return (
    <div className="bg-main-bg min-h-screen">
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-trading"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50
                   focus:px-4 focus:py-2 focus:bg-interactive-link focus:text-white focus:rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-interactive-link"
      >
        Skip to trading interface
      </a>

      {/* Connection Status Banner - shown when not connected */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <ConnectionBadge />
      </div>

      {/* Main Layout */}
      <main
        id="main-trading"
        className="grid grid-rows-[auto_1fr] p-3 sm:p-4 lg:p-5 min-h-screen gap-3 sm:gap-4"
        role="main"
        aria-label="Trading interface"
      >
        {/* Header Row - Market Bar + Social Links */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 sm:gap-4">
          <div className="h-[60px]">
            <MarketBar market={market} />
          </div>
          <div className="hidden lg:block h-[60px]">
            <NetBar />
          </div>
        </div>

        {/* Main Content - Chart/OrderBook + Swap Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] xl:grid-cols-[4fr_1fr] gap-3 sm:gap-4">
          {/* Trade Interface (Chart + Order Book) */}
          <div className="order-2 lg:order-1 min-h-[400px] lg:min-h-0">
            <TradeInterface market={market} />
          </div>

          {/* Swap Interface (Buy/Sell Form) */}
          <div className="order-1 lg:order-2">
            <SwapInterface market={market} />
          </div>
        </div>

        {/* Orders Panel with Tabs */}
        <section
          className="h-[250px] lg:h-[300px] bg-container-bg rounded-xl border border-container-border overflow-hidden flex flex-col"
          aria-label="Orders and alerts"
        >
          {/* Tab Header */}
          <div className="flex border-b border-container-border" role="tablist" aria-label="Orders panel tabs">
            <OrdersTabButton
              id="tab-open"
              label="Open Orders"
              isActive={ordersTab === 'open'}
              onClick={() => setOrdersTab('open')}
              controls="panel-open"
            />
            <OrdersTabButton
              id="tab-history"
              label="Order History"
              isActive={ordersTab === 'history'}
              onClick={() => setOrdersTab('history')}
              controls="panel-history"
            />
            <OrdersTabButton
              id="tab-alerts"
              label="Price Alerts"
              isActive={ordersTab === 'alerts'}
              onClick={() => setOrdersTab('alerts')}
              badge={alerts.length > 0 ? alerts.length : undefined}
              controls="panel-alerts"
            />
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            <div
              id="panel-open"
              role="tabpanel"
              aria-labelledby="tab-open"
              hidden={ordersTab !== 'open'}
              className="h-full"
            >
              {ordersTab === 'open' && <OpenOrders market={market} />}
            </div>
            <div
              id="panel-history"
              role="tabpanel"
              aria-labelledby="tab-history"
              hidden={ordersTab !== 'history'}
              className="h-full"
            >
              {ordersTab === 'history' && <OrderHistory market={market} />}
            </div>
            <div
              id="panel-alerts"
              role="tabpanel"
              aria-labelledby="tab-alerts"
              hidden={ordersTab !== 'alerts'}
              className="h-full"
            >
              {ordersTab === 'alerts' && (
                <PriceAlerts
                  currentPrice={currentPrice}
                  alerts={alerts}
                  onAddAlert={addAlert}
                  onRemoveAlert={removeAlert}
                  onClearTriggered={clearTriggered}
                />
              )}
            </div>
          </div>
        </section>

        {/* Mobile Footer - Social Links */}
        <div className="lg:hidden">
          <NetBar />
        </div>
      </main>
    </div>
  );
};

/**
 * Tab button for orders panel with proper ARIA attributes
 */
function OrdersTabButton({
  id,
  label,
  isActive,
  onClick,
  badge,
  controls,
}: {
  id: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
  controls: string;
}) {
  return (
    <button
      id={id}
      role="tab"
      aria-selected={isActive}
      aria-controls={controls}
      tabIndex={isActive ? 0 : -1}
      onClick={onClick}
      className={`
        flex-1 py-2.5 px-4 text-sm font-medium transition-colors relative
        focus:outline-none focus:ring-2 focus:ring-inset focus:ring-interactive-link/50
        ${isActive
          ? 'text-text-default border-b-2 border-interactive-link bg-container-bg-hover/30'
          : 'text-text-secondary hover:text-text-default hover:bg-container-bg-hover/20'
        }
      `}
    >
      <span className="flex items-center justify-center gap-1.5">
        {label}
        {badge !== undefined && badge > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] bg-interactive-link/20 text-interactive-link rounded-full">
            {badge}
          </span>
        )}
      </span>
    </button>
  );
}
