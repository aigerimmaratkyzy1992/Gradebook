import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { className?: string };

export function Button({ className = "", ...props }: Props) {
  return (
    <button
      {...props}
      className={`rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-[transform,opacity] duration-150 ease-out hover:opacity-90 active:scale-[0.97] disabled:opacity-50 ${className}`}
    />
  );
}
