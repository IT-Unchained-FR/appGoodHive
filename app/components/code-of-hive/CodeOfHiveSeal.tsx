import Image from "next/image";

import { getCodeOfHiveBadgeAsset } from "@/app/constants/code-of-hive";

interface CodeOfHiveSealProps {
  cohort?: string | null;
  /** Rendered width in px. Height follows the artwork's aspect ratio. */
  size?: number;
  /** Set only for the landing-page hero, where the seal is the LCP element. */
  priority?: boolean;
  className?: string;
}

/**
 * The full badge artwork.
 *
 * Only for surfaces where the seal is the subject — the landing page hero and
 * the post-signature success state. Never render this in a profile header: the
 * artwork's fine lettering ("Committed Member", "Nuptial Flight 2026") is
 * unreadable below ~160px. Use CodeOfHiveBadge there instead.
 */
export function CodeOfHiveSeal({
  cohort,
  size = 280,
  priority = false,
  className = "",
}: CodeOfHiveSealProps) {
  const asset = getCodeOfHiveBadgeAsset(cohort);
  const height = Math.round((size * asset.height) / asset.width);

  return (
    <Image
      src={asset.seal}
      alt={`Code of the Hive — Committed Member, ${asset.label}`}
      width={size}
      height={height}
      priority={priority}
      className={`h-auto max-w-full select-none ${className}`}
      draggable={false}
    />
  );
}

export default CodeOfHiveSeal;
