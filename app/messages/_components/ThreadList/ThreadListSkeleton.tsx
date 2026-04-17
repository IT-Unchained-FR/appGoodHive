export function ThreadListSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-slate-100">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-28 rounded-full bg-slate-200" />
            <div className="h-2.5 w-40 rounded-full bg-slate-100" />
          </div>
          <div className="h-2.5 w-8 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
