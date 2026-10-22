import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface IEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: IEmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-10 text-center", className)}>
      {Icon && (
        <span className="mb-3 flex size-10 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
          <Icon className="size-5" aria-hidden />
        </span>
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
