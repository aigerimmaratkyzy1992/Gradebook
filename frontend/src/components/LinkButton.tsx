import type { ComponentProps } from "react";
import { Link } from "react-router";

export function LinkButton({ className = "", ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={`block rounded-xl border border-line bg-surface px-4 py-2.5 text-center text-sm font-semibold text-ink transition-[transform,border-color] duration-150 ease-out hover:border-ink active:scale-[0.97] ${className}`}
    />
  );
}
