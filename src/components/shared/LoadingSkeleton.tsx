import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
  height?: string;
}

export function LoadingSkeleton({ className, count = 1, height = 'h-12' }: LoadingSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={cn('skeleton rounded-xl', height, className)}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/30 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="skeleton w-12 h-12 rounded-xl" />
        <div className="space-y-2 flex-1">
          <div className="skeleton h-4 rounded w-3/4" />
          <div className="skeleton h-3 rounded w-1/2" />
        </div>
      </div>
      <div className="skeleton h-3 rounded" />
      <div className="skeleton h-3 rounded w-5/6" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <div className="skeleton h-10 rounded-xl" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-14 rounded-xl opacity-70" style={{ opacity: 1 - i * 0.1 }} />
      ))}
    </div>
  );
}
