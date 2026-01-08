import { Navigate, useParams } from "react-router-dom";
import { MarketBar } from "../components/MarketBar";
import { NetBar } from "../components/NetBar";
import { SwapInterface } from "../components/SwapInterface";
import { TradeInterface } from "../components/TradeInterface";
import { OpenOrders } from "../components/OpenOrders";
import { OrderHistory } from "../components/OrderHistory";
import { useEffect, useCallback, useState } from "react";
import { createUser } from "../utils/requests";
import { ConnectionBadge } from "../components/ui/ConnectionStatus";

type OrdersTab = 'open' | 'history';

export const Trade = () => {
  const { market } = useParams();
  const [ordersTab, setOrdersTab] = useState<OrdersTab>('open');

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
      } catch (error) {
        // Silently fail - user will be created on order submission if needed
      }
    }
  }, []);

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  // Redirect invalid markets to default
  if (market !== "SOL_USDC") {
    return <Navigate to="/trade/SOL_USDC" replace />;
  }

  return (
    <div className="bg-main-bg min-h-screen">
      {/* Connection Status Banner - shown when not connected */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <ConnectionBadge />
      </div>

      {/* Main Layout */}
      <div className="grid grid-rows-[auto_1fr] p-3 sm:p-4 lg:p-5 min-h-screen gap-3 sm:gap-4">
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
        <div className="h-[250px] lg:h-[300px] bg-container-bg rounded-xl border border-container-border overflow-hidden flex flex-col">
          {/* Tab Header */}
          <div className="flex border-b border-container-border">
            <OrdersTabButton
              label="Open Orders"
              isActive={ordersTab === 'open'}
              onClick={() => setOrdersTab('open')}
            />
            <OrdersTabButton
              label="Order History"
              isActive={ordersTab === 'history'}
              onClick={() => setOrdersTab('history')}
            />
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {ordersTab === 'open' ? (
              <OpenOrders market={market} />
            ) : (
              <OrderHistory market={market} />
            )}
          </div>
        </div>

        {/* Mobile Footer - Social Links */}
        <div className="lg:hidden">
          <NetBar />
        </div>
      </div>
    </div>
  );
};

/**
 * Tab button for orders panel
 */
function OrdersTabButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 py-2.5 px-4 text-sm font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-inset focus:ring-interactive-link/50
        ${isActive
          ? 'text-text-default border-b-2 border-interactive-link bg-container-bg-hover/30'
          : 'text-text-secondary hover:text-text-default hover:bg-container-bg-hover/20'
        }
      `}
    >
      {label}
    </button>
  );
}
