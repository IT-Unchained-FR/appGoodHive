import type { ReactNode } from "react";

interface BlogHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string | null;
  /** Rendered under the subtitle, e.g. the topic bar. */
  children?: ReactNode;
}

export default function BlogHeader({ eyebrow = "GoodHive Blog", title, subtitle, children }: BlogHeaderProps) {
  return (
    <header className="relative overflow-hidden border-b border-amber-100 bg-gradient-to-b from-amber-50/80 to-[#fffdf6]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 lg:px-8 lg:pb-12 lg:pt-16">
        <p className="text-sm font-semibold text-amber-700">{eyebrow}</p>
        <h1 className="mt-2 max-w-3xl text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">{subtitle}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </header>
  );
}
