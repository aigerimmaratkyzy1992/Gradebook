import type { SelectHTMLAttributes } from "react";

export function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { className?: string }) {
  return (
    <select
      {...props}
      className={`rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-150 focus:border-ink disabled:text-muted ${className}`}
    />
  );
}
