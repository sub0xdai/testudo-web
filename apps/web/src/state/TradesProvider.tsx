import {
  ReactNode,
  useState,
  createContext,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Ticker, Stat, Trade } from "../utils/types";

/**
 * Loading state for different data sources
 */
interface LoadingState {
  ticker: boolean;
  orderBook: boolean;
  trades: boolean;
  chart: boolean;
}

/**
 * Error state with user-friendly messages
 */
interface ErrorState {
  ticker: string | null;
  orderBook: string | null;
  trades: string | null;
  chart: string | null;
  submission: string | null;
}

/**
 * Connection state for WebSocket
 */
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface TradesProviderProps {
  children: ReactNode;
}

interface TradesContextType {
  // Market data
  ticker: Ticker | null;
  setTicker: (ticker: Ticker | null) => void;
  stats: Stat[];
  setStats: (stats: Stat[]) => void;
  price: string | undefined;
  setPrice: (price: string | undefined) => void;

  // Trades
  trades: Trade[];
  setTrades: (trades: Trade[]) => void;
  addTrade: (trade: Trade) => void;

  // Order book depth
  bids: [string, string][];
  asks: [string, string][];
  setBids: (bids: [string, string][] | ((prev: [string, string][]) => [string, string][])) => void;
  setAsks: (asks: [string, string][] | ((prev: [string, string][]) => [string, string][])) => void;
  totalBidSize: number;
  totalAskSize: number;

  // Loading states
  loading: LoadingState;
  setLoading: (key: keyof LoadingState, value: boolean) => void;
  isLoading: boolean;

  // Error states
  errors: ErrorState;
  setError: (key: keyof ErrorState, message: string | null) => void;
  clearErrors: () => void;
  hasError: boolean;

  // Connection status
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;

  // Order submission
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;

  // Refs
  orderBookRef: React.MutableRefObject<HTMLDivElement | null>;
}

const defaultLoadingState: LoadingState = {
  ticker: true,
  orderBook: true,
  trades: true,
  chart: true,
};

const defaultErrorState: ErrorState = {
  ticker: null,
  orderBook: null,
  trades: null,
  chart: null,
  submission: null,
};

const TradesContext = createContext<TradesContextType>({
  ticker: null,
  setTicker: () => {},
  stats: [],
  setStats: () => {},
  price: undefined,
  setPrice: () => {},
  trades: [],
  setTrades: () => {},
  addTrade: () => {},
  bids: [],
  asks: [],
  setBids: () => {},
  setAsks: () => {},
  totalBidSize: 0,
  totalAskSize: 0,
  loading: defaultLoadingState,
  setLoading: () => {},
  isLoading: true,
  errors: defaultErrorState,
  setError: () => {},
  clearErrors: () => {},
  hasError: false,
  connectionStatus: 'connecting',
  setConnectionStatus: () => {},
  isSubmitting: false,
  setIsSubmitting: () => {},
  orderBookRef: { current: null },
});

const TradesProvider = ({ children }: TradesProviderProps) => {
  // Market data
  const [ticker, setTicker] = useState<Ticker | null>(null);
  const [stats, setStats] = useState<Stat[]>([]);
  const [price, setPrice] = useState<string>();

  // Trades with sliding window
  const [trades, setTradesState] = useState<Trade[]>([]);

  // Order book depth
  const [bids, setBidsState] = useState<[string, string][]>([]);
  const [asks, setAsksState] = useState<[string, string][]>([]);

  // Loading and error states
  const [loading, setLoadingState] = useState<LoadingState>(defaultLoadingState);
  const [errors, setErrorsState] = useState<ErrorState>(defaultErrorState);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs
  const orderBookRef = useRef<HTMLDivElement>(null);

  // Memoized setters to prevent unnecessary re-renders
  const setTrades = useCallback((newTrades: Trade[]) => {
    setTradesState(newTrades);
  }, []);

  const addTrade = useCallback((trade: Trade) => {
    setTradesState((prev) => {
      const updated = [trade, ...prev];
      return updated.slice(0, 50); // Keep last 50 trades
    });
  }, []);

  const setBids = useCallback((bidsOrUpdater: [string, string][] | ((prev: [string, string][]) => [string, string][])) => {
    if (typeof bidsOrUpdater === 'function') {
      setBidsState(bidsOrUpdater);
    } else {
      setBidsState(bidsOrUpdater);
    }
  }, []);

  const setAsks = useCallback((asksOrUpdater: [string, string][] | ((prev: [string, string][]) => [string, string][])) => {
    if (typeof asksOrUpdater === 'function') {
      setAsksState(asksOrUpdater);
    } else {
      setAsksState(asksOrUpdater);
    }
  }, []);

  const setLoading = useCallback((key: keyof LoadingState, value: boolean) => {
    setLoadingState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setError = useCallback((key: keyof ErrorState, message: string | null) => {
    setErrorsState((prev) => ({ ...prev, [key]: message }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrorsState(defaultErrorState);
  }, []);

  // Computed values
  const totalBidSize = useMemo(() => {
    return bids.reduce((sum, [, qty]) => sum + parseFloat(qty || '0'), 0);
  }, [bids]);

  const totalAskSize = useMemo(() => {
    return asks.reduce((sum, [, qty]) => sum + parseFloat(qty || '0'), 0);
  }, [asks]);

  const isLoading = useMemo(() => {
    return Object.values(loading).some(Boolean);
  }, [loading]);

  const hasError = useMemo(() => {
    return Object.values(errors).some(Boolean);
  }, [errors]);

  const contextValue = useMemo<TradesContextType>(() => ({
    ticker,
    setTicker,
    stats,
    setStats,
    price,
    setPrice,
    trades,
    setTrades,
    addTrade,
    bids,
    asks,
    setBids,
    setAsks,
    totalBidSize,
    totalAskSize,
    loading,
    setLoading,
    isLoading,
    errors,
    setError,
    clearErrors,
    hasError,
    connectionStatus,
    setConnectionStatus,
    isSubmitting,
    setIsSubmitting,
    orderBookRef,
  }), [
    ticker, stats, price, trades, bids, asks,
    totalBidSize, totalAskSize, loading, isLoading,
    errors, hasError, connectionStatus, isSubmitting,
    setTrades, addTrade, setBids, setAsks, setLoading, setError, clearErrors,
  ]);

  return (
    <TradesContext.Provider value={contextValue}>
      {children}
    </TradesContext.Provider>
  );
};

export { TradesContext, TradesProvider };
export type { LoadingState, ErrorState, ConnectionStatus };
