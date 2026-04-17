export function MessageListSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Incoming */}
      <div className="flex items-end gap-2 animate-pulse">
        <div className="h-8 w-8 flex-shrink-0 rounded-full bg-slate-200" />
        <div className="h-10 w-52 rounded-3xl rounded-bl-md bg-slate-200" />
      </div>
      {/* Outgoing */}
      <div className="flex flex-row-reverse items-end gap-2 animate-pulse">
        <div className="h-10 w-44 rounded-3xl rounded-br-md bg-amber-100" />
      </div>
      {/* Incoming */}
      <div className="flex items-end gap-2 animate-pulse">
        <div className="h-8 w-8 flex-shrink-0 rounded-full bg-slate-200" />
        <div className="h-14 w-64 rounded-3xl rounded-bl-md bg-slate-200" />
      </div>
    </div>
  );
}
