import { useEffect, useCallback, useRef } from 'react';

type ShortcutHandler = () => void;

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: ShortcutHandler;
  description: string;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
}

/**
 * Hook for registering keyboard shortcuts
 * Handles modifier keys (Ctrl, Shift, Alt) and prevents default browser behavior
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true } = options;
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs (except for Escape)
    const target = event.target as HTMLElement;
    const isInputFocused =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable;

    for (const shortcut of shortcutsRef.current) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        // Allow Escape to work even in inputs
        if (isInputFocused && shortcut.key.toLowerCase() !== 'escape') {
          continue;
        }

        event.preventDefault();
        event.stopPropagation();
        shortcut.handler();
        return;
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

/**
 * Pre-defined trading shortcuts
 */
export const TRADING_SHORTCUTS = {
  BUY: { key: 'b', ctrl: true, description: 'Switch to Buy mode' },
  SELL: { key: 's', ctrl: true, description: 'Switch to Sell mode' },
  CANCEL: { key: 'Escape', description: 'Clear form / Cancel' },
  SUBMIT: { key: 'Enter', ctrl: true, description: 'Submit order' },
} as const;

/**
 * Hook for showing keyboard shortcuts help
 */
export function useShortcutsHelp(shortcuts: ShortcutConfig[]) {
  return shortcuts.map(s => ({
    keys: formatShortcutKeys(s),
    description: s.description,
  }));
}

function formatShortcutKeys(shortcut: ShortcutConfig): string {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  parts.push(shortcut.key.toUpperCase());
  return parts.join(' + ');
}

export default useKeyboardShortcuts;
