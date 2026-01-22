import { useEffect, useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { ChartManager } from '../../utils/chart_manager';
import { useOpenPositions, type OpenPosition } from '../../hooks/useOpenPositions';
import { PositionHandleOverlay, type HandleType } from './PositionHandleOverlay';
import { updateEntryPrice, updateStopLoss, updateTakeProfit } from '../../utils/requests';

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
    // Track previous position IDs for auto-edit detection
    const prevPositionIdsRef = useRef<Set<string>>(new Set());

    // FR-5.3.1: State for editing position
    const [editingPositionId, setEditingPositionId] = useState<string | null>(null);
    const [editingLevels, setEditingLevels] = useState<OpenPosition['levels'] | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Expose refresh method via ref
    useImperativeHandle(ref, () => ({
      refresh,
    }), [refresh]);

    // FR-5.3.1: Auto-edit new positions when they appear
    useEffect(() => {
      const currentIds = new Set(positions.map(p => p.id));
      const prevIds = prevPositionIdsRef.current;

      // Find newly added positions
      for (const id of currentIds) {
        if (!prevIds.has(id)) {
          // New position appeared - auto-enter edit mode
          const newPosition = positions.find(p => p.id === id);
          if (newPosition?.levels) {
            setEditingPositionId(id);
            setEditingLevels({ ...newPosition.levels });
          }
          break; // Only edit one at a time
        }
      }

      prevPositionIdsRef.current = currentIds;
    }, [positions]);

    // Get the position being edited
    const editingPosition = editingPositionId
      ? positions.find(p => p.id === editingPositionId)
      : null;

    // Sync editing levels with position when position updates (only if not already editing)
    useEffect(() => {
      if (editingPosition?.levels && !editingLevels) {
        setEditingLevels({ ...editingPosition.levels });
      }
    }, [editingPosition, editingLevels]);

    // FR-5.3.4: Handle level change during drag (visual only)
    const handleLevelChange = useCallback((type: HandleType, price: number) => {
      if (!editingPositionId || !editingLevels) return;

      // Update local state immediately for visual feedback
      const newLevels = { ...editingLevels };
      if (type === 'entry') newLevels.entry = price;
      else if (type === 'stopLoss') newLevels.stopLoss = price;
      else if (type === 'takeProfit') newLevels.takeProfit = price;
      setEditingLevels(newLevels);

      // Update the canvas primitive immediately for visual sync
      if (chartManager) {
        chartManager.updateOpenPositionLevels(editingPositionId, newLevels);
      }
    }, [editingPositionId, editingLevels, chartManager]);

    // FR-5.1.4: Handle drag end - call API to persist changes
    const handleDragEnd = useCallback(async (type: HandleType, price: number) => {
      if (!editingPositionId || !editingLevels) return;

      const userId = localStorage.getItem('user_id');
      if (!userId) {
        toast.error('Not authenticated');
        return;
      }

      // Get the original levels to compare
      const originalPosition = positions.find(p => p.id === editingPositionId);
      const originalLevels = originalPosition?.levels;
      if (!originalLevels) return;

      // Check if the value actually changed
      let originalValue: number;
      if (type === 'entry') originalValue = originalLevels.entry;
      else if (type === 'stopLoss') originalValue = originalLevels.stopLoss;
      else originalValue = originalLevels.takeProfit;

      if (Math.abs(price - originalValue) < 0.01) {
        // No significant change, skip API call
        return;
      }

      setIsSubmitting(true);

      try {
        // Call the appropriate API based on which handle was dragged
        if (type === 'entry') {
          await updateEntryPrice(editingPositionId, price, userId);
          toast.success('Entry price updated');
        } else if (type === 'stopLoss') {
          await updateStopLoss(editingPositionId, price, userId);
          toast.success('Stop loss updated');
        } else if (type === 'takeProfit') {
          await updateTakeProfit(editingPositionId, price, 100, userId);
          toast.success('Take profit updated');
        }

        // Refresh positions to get updated data from server
        await refresh();

        // Update editingLevels to match new server state
        const updatedPosition = positions.find(p => p.id === editingPositionId);
        if (updatedPosition?.levels) {
          setEditingLevels({ ...updatedPosition.levels });
        }
      } catch (err) {
        // FR-5.3.4: Toast notification on API error
        toast.error('Update failed', {
          description: err instanceof Error ? err.message : 'Unknown error',
        });
        // Revert visual to original levels
        if (chartManager && originalLevels) {
          chartManager.updateOpenPositionLevels(editingPositionId, originalLevels);
        }
        setEditingLevels({ ...originalLevels });
      } finally {
        setIsSubmitting(false);
      }
    }, [editingPositionId, editingLevels, positions, chartManager, refresh]);

    // FR-5.3.4: Apply all level changes via API (for Enter key)
    const handleApplyChanges = useCallback(async () => {
      if (!editingPositionId || !editingLevels || !editingPosition?.levels) return;

      const userId = localStorage.getItem('user_id');
      if (!userId) {
        toast.error('Not authenticated');
        return;
      }

      setIsSubmitting(true);
      const originalLevels = editingPosition.levels;

      try {
        // Determine what changed and call appropriate API
        if (Math.abs(editingLevels.entry - originalLevels.entry) > 0.01) {
          await updateEntryPrice(editingPositionId, editingLevels.entry, userId);
          toast.success('Entry price updated');
        }
        if (Math.abs(editingLevels.stopLoss - originalLevels.stopLoss) > 0.01) {
          await updateStopLoss(editingPositionId, editingLevels.stopLoss, userId);
          toast.success('Stop loss updated');
        }
        if (Math.abs(editingLevels.takeProfit - originalLevels.takeProfit) > 0.01) {
          await updateTakeProfit(editingPositionId, editingLevels.takeProfit, 100, userId);
          toast.success('Take profit updated');
        }

        // Refresh positions to get updated data
        await refresh();
      } catch (err) {
        // FR-5.3.4: Toast notification on API error
        toast.error('Update failed', {
          description: err instanceof Error ? err.message : 'Unknown error',
        });
        // Revert visual to original levels
        if (chartManager) {
          chartManager.updateOpenPositionLevels(editingPositionId, originalLevels);
        }
        setEditingLevels({ ...originalLevels });
      } finally {
        setIsSubmitting(false);
      }
    }, [editingPositionId, editingLevels, editingPosition, chartManager, refresh]);

    // FR-5.3.5: Cancel editing and revert changes
    const handleCancelEdit = useCallback(() => {
      if (editingPositionId && editingPosition?.levels && chartManager) {
        // Revert to original levels
        chartManager.updateOpenPositionLevels(editingPositionId, editingPosition.levels);
      }
      setEditingPositionId(null);
      setEditingLevels(null);
    }, [editingPositionId, editingPosition, chartManager]);

    // FR-5.3.5/6: Keyboard shortcuts
    useEffect(() => {
      if (!editingPositionId) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          handleCancelEdit();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleApplyChanges();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editingPositionId, handleCancelEdit, handleApplyChanges]);

    // Sync primitives with position state
    useEffect(() => {
      if (!chartManager) return;

      // DEBUG: Log positions and their levels
      console.log('[OpenPositionsLayer] positions:', positions.map(p => ({
        id: p.id,
        symbol: p.symbol,
        status: p.status,
        hasLevels: p.levels !== null,
        levels: p.levels,
      })));

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
      // IMPORTANT: Skip the editing position to prevent poll from overwriting edits
      for (const position of positions) {
        if (position.levels && !newIds.includes(position.id)) {
          // Skip updating the position being edited - let local state control it
          if (position.id === editingPositionId) {
            continue;
          }
          chartManager.updateOpenPositionLevels(position.id, position.levels);
        }
      }

      // Update our tracking ref
      renderedPositionsRef.current = new Set(activeIds);
    }, [chartManager, positions, editingPositionId]);

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

    // FR-5.1/5.2: Render PositionHandleOverlay for editing position
    if (editingPositionId && editingLevels && editingPosition) {
      // Determine which handles should be locked
      // FR-5.2.1: Entry is locked for filled (Active) orders
      const lockedHandles: HandleType[] = editingPosition.status === 'Active' ? ['entry'] : [];

      return (
        <PositionHandleOverlay
          chartManager={chartManager}
          levels={editingLevels}
          onLevelChange={handleLevelChange}
          onDragEnd={handleDragEnd}
          onExecute={handleApplyChanges}
          onCancel={handleCancelEdit}
          isSubmitting={isSubmitting}
          lockedHandles={lockedHandles}
          isExistingPosition={true}
          positionId={editingPositionId}
        />
      );
    }

    return null;
  }
);

export default OpenPositionsLayer;
