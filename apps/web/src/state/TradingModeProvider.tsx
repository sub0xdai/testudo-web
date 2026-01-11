import {
  ReactNode,
  useState,
  createContext,
  useCallback,
  useMemo,
} from "react";

/**
 * Execution mode for trading
 * - shadow: Paper trading, no real orders
 * - live: Real orders on Binance
 */
export type ExecutionMode = 'shadow' | 'live';

interface TradingModeContextType {
  mode: ExecutionMode;
  setMode: (mode: ExecutionMode) => void;
  isLiveMode: boolean;
  isShadowMode: boolean;
}

const TradingModeContext = createContext<TradingModeContextType>({
  mode: 'shadow',
  setMode: () => {},
  isLiveMode: false,
  isShadowMode: true,
});

interface TradingModeProviderProps {
  children: ReactNode;
}

/**
 * Provider for trading execution mode state.
 * Defaults to shadow mode for safety.
 */
const TradingModeProvider = ({ children }: TradingModeProviderProps) => {
  const [mode, setModeState] = useState<ExecutionMode>('shadow');

  const setMode = useCallback((newMode: ExecutionMode) => {
    setModeState(newMode);
  }, []);

  const isLiveMode = useMemo(() => mode === 'live', [mode]);
  const isShadowMode = useMemo(() => mode === 'shadow', [mode]);

  const contextValue = useMemo<TradingModeContextType>(() => ({
    mode,
    setMode,
    isLiveMode,
    isShadowMode,
  }), [mode, setMode, isLiveMode, isShadowMode]);

  return (
    <TradingModeContext.Provider value={contextValue}>
      {children}
    </TradingModeContext.Provider>
  );
};

export { TradingModeContext, TradingModeProvider };
