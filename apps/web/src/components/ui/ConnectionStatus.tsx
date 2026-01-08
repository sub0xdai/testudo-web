import { useContext } from 'react';
import { TradesContext, ConnectionStatus as ConnectionStatusType } from '../../state/TradesProvider';

interface StatusConfig {
  color: string;
  bgColor: string;
  label: string;
  animate: boolean;
}

const STATUS_CONFIG: Record<ConnectionStatusType, StatusConfig> = {
  connecting: {
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-500/20',
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
 * Inline connection status badge
 */
export function ConnectionBadge() {
  const { connectionStatus } = useContext(TradesContext);

  const config = STATUS_CONFIG[connectionStatus];

  if (connectionStatus === 'connected') {
    return null; // Don't show badge when connected (clean UI)
  }

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2 py-1 rounded-full
        ${config.bgColor} text-text-default text-xs
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
      {config.label}
    </div>
  );
}

export default ConnectionStatus;
