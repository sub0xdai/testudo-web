import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { ChartManager } from '../../utils/chart_manager';
import { useOpenPositions, type OpenPosition } from '../../hooks/useOpenPositions';

/**
 * Style configuration for open position rendering
 * Uses slightly different colors to distinguish from drawing tool
 */
const OPEN_POSITION_STYLE = {
  // Slightly more opaque for committed positions
  profitColor: 'rgba(52, 203, 136, 0.25)',
  lossColor: 'rgba(255, 97, 92, 0.25)',
  // Solid colors for committed positions
  entryLineColor: '#f0b90b',
  slLineColor: '#ff615c',
  tpLineColor: '#34cb88',
  lineWidth: 1,
};

interface OpenPositionsLayerProps {
  chartManager: ChartManager | null;
  market: string;
  /** Optional callback when a position is clicked */
  onPositionClick?: (position: OpenPosition) => void;
}

/**
 * Ref handle for imperative control
 */
export interface OpenPositionsLayerRef {
  /** Manually refresh positions from API */
  refresh: () => Promise<void>;
}

/**
 * OpenPositionsLayer - Renders persistent position lines for open trades
 *
 * This component manages the lifecycle of position primitives on the chart,
 * fetching open positions from the API and rendering them as chart overlays.
 *
 * Features:
 * - Auto-fetches positions on mount and polls for updates
 * - Syncs primitives with position state (adds new, removes closed)
 * - Provides imperative refresh via ref
 * - Persists across chart interval changes
 */
export const OpenPositionsLayer = forwardRef<OpenPositionsLayerRef, OpenPositionsLayerProps>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function OpenPositionsLayer({ chartManager, market, onPositionClick: _onPositionClick }, ref) {
    const { positions, refresh, isLoading } = useOpenPositions({
      market,
      pollInterval: 5000,
      enablePolling: true,
    });

    // Track which positions we've rendered
    const renderedPositionsRef = useRef<Set<string>>(new Set());

    // Expose refresh method via ref
    useImperativeHandle(ref, () => ({
      refresh,
    }), [refresh]);

    // Sync primitives with position state
    useEffect(() => {
      if (!chartManager) return;

      // Get IDs of positions that should be displayed
      const activeIds = positions
        .filter(p => p.levels !== null)
        .map(p => p.id);

      // Sync with chart manager - removes stale, returns new IDs needed
      const newIds = chartManager.syncOpenPositions(activeIds);

      // Attach primitives for new positions
      for (const id of newIds) {
        const position = positions.find(p => p.id === id);
        if (position?.levels) {
          const primitive = chartManager.attachOpenPositionPrimitive(id, OPEN_POSITION_STYLE);
          primitive.updateLevels(position.levels);
        }
      }

      // Update existing primitives (in case levels changed)
      for (const position of positions) {
        if (position.levels && !newIds.includes(position.id)) {
          chartManager.updateOpenPositionLevels(position.id, position.levels);
        }
      }

      // Update our tracking ref
      renderedPositionsRef.current = new Set(activeIds);
    }, [chartManager, positions]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (chartManager) {
          chartManager.detachAllOpenPositionPrimitives();
        }
      };
    }, [chartManager]);

    // This component doesn't render any DOM - it manages canvas primitives
    // We could add a loading indicator or position info panel here in the future
    if (isLoading && positions.length === 0) {
      return null;
    }

    // Optional: Render position labels/badges (DOM overlay)
    // For now, we only render via canvas primitives
    return null;
  }
);

export default OpenPositionsLayer;
