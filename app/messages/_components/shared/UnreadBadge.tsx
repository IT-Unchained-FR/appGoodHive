interface UnreadBadgeProps {
  count: number;
  max?: number;
  className?: string;
}

export function UnreadBadge({ count, max = 99, className = "" }: UnreadBadgeProps) {
  if (count <= 0) return null;
  const label = count > max ? `${max}+` : String(count);
  return (
    <span
      className={`inline-flex min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 py-0.5 text-[10px] font-bold leading-none text-white ${className}`}
    >
      {label}
    </span>
  );
}
