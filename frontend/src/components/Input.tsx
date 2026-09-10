import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { className?: string };

export function Input({ className = "", ...props }: Props) {
  return (
    <input
      {...props}
      className={`rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none transition-colors duration-150 placeholder:text-muted focus:border-ink ${className}`}
    />
  );
}
