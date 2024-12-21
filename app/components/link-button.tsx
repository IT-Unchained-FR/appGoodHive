import Link from "next/link";
import { type LinkProps } from "next/dist/client/link.js";
import { type StaticImport } from "next/dist/shared/lib/get-img-props";
import clsx from "clsx";
import { Route } from "next";
import Image from "next/image";

type Props = LinkProps<Route> & {
  icon: string | StaticImport;
  iconSize: "medium" | "large";
  variant: "primary" | "secondary";
} & React.PropsWithChildren;

export function LinkButton({
  icon,
  iconSize = "medium",
  variant = "primary",
  children,
  ...props
}: Props) {
  const baseClasses = [
    "my-2",
    "text-base",
    "bg-[#FFC905]",
    "rounded-full",
    "inline-flex",
    "items-center",
    "justify-center",
    "duration-150",
    "transition",
    "ease-in-out",
    "active:shadow-md",
  ];

  const sizes = {
    medium: ["h-12", "w-44", "text-sm", "font-semibold"],
    large: ["font-semibold", "h-14", "w-56"],
  };

  const variants = {
    primary: ["hover:bg-opacity-80"],
    secondary: [
      "border-2",
      "border-[#FFC905]",
      "bg-opacity-0",
      "hover:bg-opacity-20",
    ],
  };

  return (
    <Link
      className={clsx(baseClasses, variants[variant], sizes[iconSize])}
      {...props}
      href={props.href as Route}
    >
      {icon && <Image alt="search" className="w-6 h-4 mr-3" src={icon} />}
      <span>{children}</span>
    </Link>
  );
}
