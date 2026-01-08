import { useState, useEffect, useCallback, useRef } from 'react';
import { PriceAlert } from '../utils/types';
import { toast } from 'sonner';
import { formatUSD } from '../utils/format';

const STORAGE_KEY = 'testudo_price_alerts';

/**
 * Hook for managing price alerts with localStorage persistence
 * Monitors price changes and triggers notifications when targets are hit
 */
export function usePriceAlerts(currentPrice: number, market: string) {
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const previousPrice = useRef<number>(currentPrice);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Persist alerts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    } catch {
      // Silently fail if localStorage is unavailable
    }
  }, [alerts]);

  // Check alerts when price changes
  useEffect(() => {
    if (currentPrice <= 0) return;

    const prevPrice = previousPrice.current;
    previousPrice.current = currentPrice;

    // Skip first check
    if (prevPrice <= 0) return;

    // Check each alert
    alerts.forEach((alert) => {
      if (alert.triggered || alert.market !== market) return;

      const shouldTrigger =
        (alert.condition === 'above' && prevPrice < alert.targetPrice && currentPrice >= alert.targetPrice) ||
        (alert.condition === 'below' && prevPrice > alert.targetPrice && currentPrice <= alert.targetPrice);

      if (shouldTrigger) {
        triggerAlert(alert);
      }
    });
  }, [currentPrice, market, alerts]);

  const triggerAlert = useCallback((alert: PriceAlert) => {
    // Mark as triggered
    setAlerts((prev) =>
      prev.map((a) => (a.id === alert.id ? { ...a, triggered: true } : a))
    );

    // Play notification sound
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQoGIpbU5rWCAw4cj9PttIUDDxuL0vC0gwMPGYnQ8bGBAw8YiM7xr38DDxeGzfGtfQMOFoTL8at7Aw4Vgsnwqnm/');
      }
      audioRef.current.play().catch(() => {});
    } catch {
      // Audio not supported
    }

    // Show toast notification
    const direction = alert.condition === 'above' ? 'rose above' : 'dropped below';
    toast.success(
      `Price Alert: ${market} ${direction} ${formatUSD(alert.targetPrice)}`,
      {
        duration: 10000,
        action: {
          label: 'Dismiss',
          onClick: () => {},
        },
      }
    );
  }, [market]);

  const addAlert = useCallback((targetPrice: number, condition: 'above' | 'below') => {
    const newAlert: PriceAlert = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      market,
      targetPrice,
      condition,
      createdAt: Date.now(),
      triggered: false,
    };

    setAlerts((prev) => [...prev, newAlert]);

    toast.success(
      `Alert set: Notify when price goes ${condition} ${formatUSD(targetPrice)}`,
      { duration: 3000 }
    );

    return newAlert.id;
  }, [market]);

  const removeAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  const clearTriggered = useCallback(() => {
    setAlerts((prev) => prev.filter((a) => !a.triggered));
  }, []);

  const clearAll = useCallback(() => {
    setAlerts([]);
  }, []);

  // Get active alerts for current market
  const activeAlerts = alerts.filter((a) => a.market === market && !a.triggered);
  const triggeredAlerts = alerts.filter((a) => a.market === market && a.triggered);

  return {
    alerts: activeAlerts,
    triggeredAlerts,
    addAlert,
    removeAlert,
    clearTriggered,
    clearAll,
    totalAlerts: alerts.length,
  };
}

export default usePriceAlerts;
