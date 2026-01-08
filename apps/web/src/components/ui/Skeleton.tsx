import { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Skeleton loading component for placeholder UI
 */
export function Skeleton({
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const baseClasses = 'bg-container-bg-hover';

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full',
  };

  const defaultSizes = {
    text: { height: '1em', width: '100%' },
    rectangular: { height: '100px', width: '100%' },
    circular: { height: '40px', width: '40px' },
  };

  const computedStyle = {
    width: width ?? defaultSizes[variant].width,
    height: height ?? defaultSizes[variant].height,
    ...style,
  };

  return (
    <div
      className={`${baseClasses} ${animationClasses[animation]} ${variantClasses[variant]} ${className}`}
      style={computedStyle}
      {...props}
    />
  );
}

/**
 * Skeleton for price display
 */
export function PriceSkeleton({ className = '' }: { className?: string }) {
  return <Skeleton variant="text" width={80} height={20} className={className} />;
}

/**
 * Skeleton for stat items (volume, high, low)
 */
export function StatSkeleton() {
  return (
    <div className="flex flex-col gap-1">
      <Skeleton variant="text" width={60} height={12} />
      <Skeleton variant="text" width={80} height={16} />
    </div>
  );
}

/**
 * Skeleton for order book row
 */
export function OrderBookRowSkeleton() {
  return (
    <div className="flex justify-between px-2 py-1">
      <Skeleton variant="text" width={70} height={14} />
      <Skeleton variant="text" width={50} height={14} />
    </div>
  );
}

/**
 * Skeleton for trade row
 */
export function TradeRowSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2 px-2 py-1">
      <Skeleton variant="text" width="100%" height={14} />
      <Skeleton variant="text" width="100%" height={14} />
      <Skeleton variant="text" width="100%" height={14} />
    </div>
  );
}

export default Skeleton;
