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
      // Use fallback
      setMarkets([
        { symbol: 'SOL_USDC', baseAsset: 'SOL', quoteAsset: 'USDC', status: 'TRADING' },
        { symbol: 'BTC_USDC', baseAsset: 'BTC', quoteAsset: 'USDC', status: 'TRADING' },
        { symbol: 'ETH_USDC', baseAsset: 'ETH', quoteAsset: 'USDC', status: 'TRADING' },
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
        className="flex items-center gap-2 px-3 py-2 bg-container-bg-hover hover:bg-container-bg-hover/80
                 border border-container-border rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <img
            src={`/${base.toLowerCase()}.svg`}
            alt={base}
            className="w-5 h-5 rounded-full"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <span className="font-semibold text-text-default">{base}</span>
          <span className="text-text-secondary">/</span>
          <span className="text-text-secondary">{quote}</span>
        </div>
        <ChevronIcon className={`w-4 h-4 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-container-bg border border-container-border
                      rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-container-border">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search markets..."
                className="w-full pl-9 pr-3 py-2 bg-container-bg-hover border border-container-border
                         text-text-default text-xs font-imperial tracking-wider uppercase placeholder:text-text-secondary placeholder:normal-case
                         focus:outline-none focus:ring-1 focus:ring-steel-primary/50"
              />
            </div>
          </div>

          {/* Markets List */}
          <div className="max-h-64 overflow-auto thin-scroll">
            {filteredMarkets.length === 0 ? (
              <div className="p-4 text-center text-[10px] text-text-secondary font-imperial tracking-wider uppercase">
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
        w-full flex items-center justify-between px-3 py-2.5 transition-colors
        ${isSelected
          ? 'bg-interactive-link/10 text-text-default'
          : 'hover:bg-container-bg-hover text-text-default'
        }
      `}
    >
      <div className="flex items-center gap-2">
        <img
          src={`/${market.baseAsset.toLowerCase()}.svg`}
          alt={market.baseAsset}
          className="w-6 h-6 rounded-full"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="text-left">
          <div className="font-medium">
            {market.baseAsset}
            <span className="text-text-secondary font-normal">/{market.quoteAsset}</span>
          </div>
        </div>
      </div>

      {isSelected && (
        <CheckIcon className="w-4 h-4 text-steel-primary" />
      )}

      {market.status === 'HALTED' && (
        <span className="px-1.5 py-0.5 text-[9px] font-imperial tracking-wider uppercase bg-negative-red/20 text-negative-red">
          Halted
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
