interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className = '', width, height }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="skeleton-text w-1/3" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
      <Skeleton className="skeleton-title w-1/2" />
      <Skeleton className="skeleton-text w-2/3" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="skeleton-text w-1/4" />
        <Skeleton className="skeleton-text w-2/5" />
      </div>
      <Skeleton className="w-16 h-6 rounded-full" />
    </div>
  );
}

export function SkeletonTableRows({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 5 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <Skeleton className="skeleton-text" width={j === 0 ? '80%' : j === 1 ? '60%' : '50%'} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
