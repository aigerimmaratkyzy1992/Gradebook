import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card text-card-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<"header">) {
  return (
    <header
      className={cn("flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-4", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn("text-base leading-tight font-semibold", className)} {...props} />;
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("mt-1 text-sm text-muted-foreground", className)} {...props} />;
}

/** Тақырыптың оң жағындағы әрекеттер. */
export function CardAction({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex shrink-0 items-center gap-2", className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}

/** Тізім үшін: шеткі бос орынсыз, жолдар арасы сызықпен. */
export function CardList({ className, ...props }: ComponentProps<"ul">) {
  return <ul className={cn("divide-y divide-border border-t border-border", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<"footer">) {
  return (
    <footer
      className={cn("flex items-center gap-2 border-t border-border bg-muted/40 px-5 py-3", className)}
      {...props}
    />
  );
}
