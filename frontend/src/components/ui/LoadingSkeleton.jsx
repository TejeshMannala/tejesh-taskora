import { motion } from 'framer-motion';

export const CardSkeleton = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="glass-card p-6 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-3/4 mb-4" />
        <div className="h-8 bg-white/10 rounded w-1/2 mb-3" />
        <div className="h-3 bg-white/10 rounded w-full mb-2" />
        <div className="h-3 bg-white/10 rounded w-2/3" />
      </div>
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="glass-card p-6 animate-pulse space-y-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4">
        <div className="h-4 bg-white/10 rounded w-1/4" />
        <div className="h-4 bg-white/10 rounded w-1/3" />
        <div className="h-4 bg-white/10 rounded w-1/5" />
      </div>
    ))}
  </div>
);

export const PageSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 bg-white/10 rounded w-1/3 mb-6" />
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-card p-6">
          <div className="h-4 bg-white/10 rounded w-1/2 mb-4" />
          <div className="h-10 bg-white/10 rounded w-1/3" />
        </div>
      ))}
    </div>
    <div className="glass-card p-6">
      <div className="h-4 bg-white/10 rounded w-full mb-4" />
      <div className="h-4 bg-white/10 rounded w-5/6 mb-4" />
      <div className="h-4 bg-white/10 rounded w-2/3" />
    </div>
  </div>
);
