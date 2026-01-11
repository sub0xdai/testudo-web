import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Market } from '../utils/types';
import { getMarkets } from '../utils/requests';
import { parseMarketSymbol } from '../utils/format';

interface MarketSelectorProps {
  currentMarket: string;
}

/**
 * Dropdown for selecting trading pairs
 */
export function MarketSelector({ currentMarket }: MarketSelectorProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { base, quote } = parseMarketSymbol(currentMarket);

  // Fetch markets on mount
  useEffect(() => {
    getMarkets().then(setMarkets).catch(() => {
      // Use fallback - perpetual futures markets
      setMarkets([
        { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', status: 'TRADING' },
        { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', status: 'TRADING' },
        { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', status: 'TRADING' },
      ]);
    });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelectMarket = useCallback((symbol: string) => {
    setIsOpen(false);
    setSearchQuery('');
    navigate(`/trade/${symbol}`);
  }, [navigate]);

  const filteredMarkets = markets.filter((market) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      market.symbol.toLowerCase().includes(query) ||
      market.baseAsset.toLowerCase().includes(query) ||
      market.quoteAsset.toLowerCase().includes(query)
    );
  });

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' && filteredMarkets.length > 0) {
      handleSelectMarket(filteredMarkets[0].symbol);
    }
  }, [filteredMarkets, handleSelectMarket]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-2 py-1 hover:bg-elevated transition-colors"
      >
        <img
          src={`/${base.toLowerCase()}.svg`}
          alt={base}
          className="w-4 h-4 mr-1.5"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <span className="font-semibold text-[12px] text-white font-mono">{base}</span>
        <span className="text-grey-dim text-[12px] mx-0.5">/</span>
        <span className="text-grey text-[12px]">{quote}</span>
        <ChevronIcon className={`w-3 h-3 text-grey ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-panel border-2 border-grid shadow-xl z-50 overflow-hidden">
          {/* Search Input */}
          <div className="p-1.5 border-b border-grid">
            <div className="relative">
              <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-grey" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search..."
                className="w-full pl-7 pr-2 py-1.5 bg-transparent border border-grid
                         text-white text-[11px] font-mono placeholder:text-grey-dim
                         focus:outline-none focus:border-grey"
              />
            </div>
          </div>

          {/* Markets List */}
          <div className="max-h-48 overflow-auto thin-scroll">
            {filteredMarkets.length === 0 ? (
              <div className="p-3 text-center text-[10px] text-grey font-mono">
                No markets found
              </div>
            ) : (
              filteredMarkets.map((market) => (
                <MarketOption
                  key={market.symbol}
                  market={market}
                  isSelected={market.symbol === currentMarket}
                  onClick={() => handleSelectMarket(market.symbol)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface MarketOptionProps {
  market: Market;
  isSelected: boolean;
  onClick: () => void;
}

function MarketOption({ market, isSelected, onClick }: MarketOptionProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center justify-between px-2 py-2 transition-colors text-[11px]
        ${isSelected
          ? 'bg-elevated text-white'
          : 'hover:bg-elevated text-grey hover:text-white'
        }
      `}
    >
      <div className="flex items-center gap-1.5">
        <img
          src={`/${market.baseAsset.toLowerCase()}.svg`}
          alt={market.baseAsset}
          className="w-4 h-4"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <span className="font-mono font-medium">
          {market.baseAsset}
          <span className="text-grey-dim">/{market.quoteAsset}</span>
        </span>
      </div>

      {isSelected && (
        <CheckIcon className="w-3 h-3 text-signal-green" />
      )}

      {market.status === 'HALTED' && (
        <span className="px-1 py-0.5 text-[8px] font-mono bg-signal-red/20 text-signal-red">
          HALT
        </span>
      )}
    </button>
  );
}

// Icons
function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default MarketSelector;
