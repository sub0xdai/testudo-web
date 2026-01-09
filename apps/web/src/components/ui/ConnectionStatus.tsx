import { useContext, useEffect, useState } from 'react';
import { TradesContext, ConnectionStatus as ConnectionStatusType } from '../../state/TradesProvider';
import { WsManager } from '../../utils/ws_manager';

interface StatusConfig {
  color: string;
  bgColor: string;
  label: string;
  animate: boolean;
}

interface ReconnectionInfo {
  attempts: number;
  nextDelay: number;
}

const STATUS_CONFIG: Record<ConnectionStatusType, StatusConfig> = {
  connecting: {
    color: 'bg-steel-primary',
    bgColor: 'bg-steel-primary/20',
    label: 'Connecting...',
    animate: true,
  },
  connected: {
    color: 'bg-positive-green',
    bgColor: 'bg-positive-green/20',
    label: 'Connected',
    animate: false,
  },
  disconnected: {
    color: 'bg-text-secondary',
    bgColor: 'bg-text-secondary/20',
    label: 'Disconnected',
    animate: false,
  },
  error: {
    color: 'bg-negative-red',
    bgColor: 'bg-negative-red/20',
    label: 'Connection Error',
    animate: false,
  },
};

interface ConnectionStatusProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Connection status indicator component
 * Shows the current WebSocket connection status
 */
export function ConnectionStatus({ showLabel = false, size = 'sm' }: ConnectionStatusProps) {
  const { connectionStatus } = useContext(TradesContext);

  const config = STATUS_CONFIG[connectionStatus];

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const textSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <div className="flex items-center gap-2" title={config.label}>
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Ping animation for connecting state */}
        {config.animate && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full ${config.color} opacity-75 animate-ping`}
          />
        )}
        {/* Status dot */}
        <span
          className={`relative inline-flex rounded-full h-full w-full ${config.color}`}
        />
      </div>

      {showLabel && (
        <span className={`${textSizes[size]} text-text-secondary`}>
          {config.label}
        </span>
      )}
    </div>
  );
}

/**
 * Inline connection status badge with reconnection info
 */
export function ConnectionBadge() {
  const { connectionStatus } = useContext(TradesContext);
  const [reconnectInfo, setReconnectInfo] = useState<ReconnectionInfo>({ attempts: 0, nextDelay: 1000 });

  const config = STATUS_CONFIG[connectionStatus];

  // Poll reconnection info when disconnected or in error state
  useEffect(() => {
    if (connectionStatus !== 'disconnected' && connectionStatus !== 'error' && connectionStatus !== 'connecting') {
      return;
    }

    const updateReconnectInfo = () => {
      const ws = WsManager.getInstance();
      setReconnectInfo(ws.getReconnectionInfo());
    };

    updateReconnectInfo();
    const interval = setInterval(updateReconnectInfo, 1000);
    return () => clearInterval(interval);
  }, [connectionStatus]);

  if (connectionStatus === 'connected') {
    return null; // Don't show badge when connected (clean UI)
  }

  const showAttempts = reconnectInfo.attempts > 0 && (connectionStatus === 'disconnected' || connectionStatus === 'error');

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1.5
        ${config.bgColor} text-text-default text-xs font-imperial tracking-wider uppercase
        border border-steel-dim/30
      `}
    >
      <div className="relative">
        {config.animate && (
          <span className={`absolute inline-flex h-full w-full ${config.color} opacity-75 animate-ping`} />
        )}
        <span className={`relative w-2 h-2 ${config.color} inline-block`} />
      </div>
      <span>{config.label}</span>
      {showAttempts && (
        <span className="text-text-secondary font-numeral text-[10px] normal-case">
          (Attempt {reconnectInfo.attempts})
        </span>
      )}
      {connectionStatus !== 'connecting' && (
        <button
          onClick={() => WsManager.getInstance().reconnect()}
          className="ml-1 text-steel-primary hover:text-steel-bright transition-colors text-[10px] font-imperial tracking-wider"
        >
          RETRY
        </button>
      )}
    </div>
  );
}

export default ConnectionStatus;
