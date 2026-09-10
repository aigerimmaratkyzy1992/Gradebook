import type { ReactNode } from "react";

type Props = {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  /** Тізім карточкасы — ішкі шеткі бос орынсыз. */
  flush?: boolean;
};

export function Card({ title, action, children, flush }: Props) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface">
      {title && (
        <header className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
          <h2 className="text-base font-bold text-ink">{title}</h2>
          {action}
        </header>
      )}
      <div className={flush ? "" : "px-5 pb-5"}>{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: string }) {
  return <p className="px-5 py-8 text-center text-sm text-muted">{children}</p>;
}
