import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

interface IPageHeaderProps {
  title: string;
  description?: ReactNode;
  /** Оң жақтағы түймелер. */
  actions?: ReactNode;
  back?: { to: string; label: string };
}

export function PageHeader({ title, description, actions, back }: IPageHeaderProps) {
  return (
    <div className="mb-6 space-y-3">
      {back && (
        <Link
          to={back.to}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
