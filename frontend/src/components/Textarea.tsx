import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string };

export function Textarea({ className = "", ...props }: Props) {
  return (
    <textarea
      {...props}
      className={`rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none transition-colors duration-150 placeholder:text-muted focus:border-ink ${className}`}
    />
  );
}
