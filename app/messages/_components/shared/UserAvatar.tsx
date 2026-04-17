import Image from "next/image";
import { initialsFromName } from "../../_utils/messenger-helpers";

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
} as const;

interface UserAvatarProps {
  src?: string | null;
  name: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

export function UserAvatar({ src, name, size = "md", className = "" }: UserAvatarProps) {
  const sizeClass = SIZE_CLASSES[size];
  const initials = initialsFromName(name);

  return (
    <div
      className={`relative flex-shrink-0 rounded-full bg-amber-100 overflow-hidden ${sizeClass} ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes="48px"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center font-semibold text-amber-700">
          {initials}
        </span>
      )}
    </div>
  );
}
