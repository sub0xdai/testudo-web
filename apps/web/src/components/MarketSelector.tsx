import { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Market } from '../utils/types';
import { getMarkets } from '../utils/requests';
import { parseMarketSymbol } from '../utils/format';

interface MarketSelectorProps {
  currentMarket: string;
}

// Popular markets to show at top when no search query
const POPULAR_BASES = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK'];

/**
 * Dropdown for selecting trading pairs with fuzzy search
 */
export function MarketSelector({ currentMarket }: MarketSelectorProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const { base } = parseMarketSymbol(currentMarket);

  // Update dropdown position when opened
  useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, [isOpen]);

  // Fetch markets on mount
  useEffect(() => {
    setIsLoading(true);
    getMarkets()
      .then(setMarkets)
      .catch(() => {
        // Use fallback - perpetual futures markets
        setMarkets([
          { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', status: 'TRADING' },
          { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', status: 'TRADING' },
          { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', status: 'TRADING' },
        ]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Close dropdown when clicking outside (check both trigger and dropdown)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedTrigger = triggerRef.current?.contains(target);
      const clickedDropdown = dropdownRef.current?.contains(target);

      if (!clickedTrigger && !clickedDropdown) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

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

  // Filter and sort markets
  const filteredMarkets = useMemo(() => {
    let filtered = markets;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = markets.filter((market) =>
        market.symbol.toLowerCase().includes(query) ||
        market.baseAsset.toLowerCase().includes(query)
      );
    } else {
      // When no search, show popular markets first
      filtered = [...markets].sort((a, b) => {
        const aPopular = POPULAR_BASES.indexOf(a.baseAsset);
        const bPopular = POPULAR_BASES.indexOf(b.baseAsset);
        if (aPopular !== -1 && bPopular !== -1) return aPopular - bPopular;
        if (aPopular !== -1) return -1;
        if (bPopular !== -1) return 1;
        return a.baseAsset.localeCompare(b.baseAsset);
      });
    }

    // Limit to 100 for performance
    return filtered.slice(0, 100);
  }, [markets, searchQuery]);

  const totalCount = markets.length;
  const showingCount = filteredMarkets.length;

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' && filteredMarkets.length > 0) {
      handleSelectMarket(filteredMarkets[0].symbol);
    }
  }, [filteredMarkets, handleSelectMarket]);

  return (
    <div className="relative">
      {/* Trigger Button - Shows symbol like SOLUSDT */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 hover:bg-elevated transition-colors"
      >
        <img
          src={`/${base.toLowerCase()}.svg`}
          alt={base}
          className="w-5 h-5"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <span className="font-semibold text-[13px] text-white font-mono tracking-wide">
          {currentMarket}
        </span>
        <ChevronIcon className={`w-4 h-4 text-grey transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown - Rendered via portal to escape container clipping */}
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 9999,
          }}
          className="w-64 bg-panel border-2 border-grid shadow-xl"
        >
          {/* Search Input */}
          <div className="p-2 border-b border-grid">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-grey" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search markets..."
                className="w-full pl-9 pr-3 py-2 bg-main-bg border border-grid
                         text-white text-[12px] font-mono placeholder:text-grey-dim
                         focus:outline-none focus:border-steel-primary"
              />
            </div>
            {/* Market count */}
            <div className="mt-1.5 text-[10px] text-grey-dim font-mono">
              {isLoading ? 'Loading...' : (
                searchQuery
                  ? `${showingCount} results${showingCount === 100 ? ' (first 100)' : ''}`
                  : `${totalCount} markets`
              )}
            </div>
          </div>

          {/* Markets List */}
          <div className="max-h-80 overflow-auto thin-scroll">
            {isLoading ? (
              <div className="p-4 text-center text-[11px] text-grey font-mono">
                Loading markets...
              </div>
            ) : filteredMarkets.length === 0 ? (
              <div className="p-4 text-center text-[11px] text-grey font-mono">
                No markets found for "{searchQuery}"
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
        </div>,
        document.body
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
        w-full flex items-center justify-between px-3 py-2.5 transition-colors text-[12px]
        ${isSelected
          ? 'bg-steel-primary/10 text-white border-l-2 border-steel-primary'
          : 'hover:bg-elevated text-grey hover:text-white border-l-2 border-transparent'
        }
      `}
    >
      <div className="flex items-center gap-2">
        <img
          src={`/${market.baseAsset.toLowerCase()}.svg`}
          alt={market.baseAsset}
          className="w-5 h-5"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <span className="font-mono font-semibold text-white">
          {market.baseAsset}
          <span className="text-grey-dim font-normal">/USDT</span>
        </span>
      </div>

      {isSelected && (
        <CheckIcon className="w-4 h-4 text-signal-green" />
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
