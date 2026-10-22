import { CircleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

/** Форма астындағы қате. Бос мәтін берілсе — ештеңе көрсетпейді. */
export function FormError({ message, className }: { message: string; className?: string }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2 text-sm text-destructive transition-opacity duration-200 starting:opacity-0",
        className,
      )}
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      {message}
    </p>
  );
}
