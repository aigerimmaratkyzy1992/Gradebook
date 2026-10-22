import { Badge } from "@/components/ui/Badge";
import { formatDate, isOverdue } from "@/lib/date";
import { cn } from "@/lib/utils";

interface IDeadlineProps {
  dueAt: string | null;
  className?: string;
}

/**
 * Мерзім. Өтіп кетсе — қызыл және белгімен; бірақ материалдарды көру мен
 * жүктеуге ешқашан кедергі жасамайды, тек ескертеді.
 */
export function Deadline({ dueAt, className }: IDeadlineProps) {
  const isPast = isOverdue(dueAt);

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center gap-x-2 gap-y-1",
        isPast && "text-destructive",
        className,
      )}
    >
      <time dateTime={dueAt ?? undefined}>{formatDate(dueAt)}</time>
      {isPast && <Badge variant="destructive">Срок истёк</Badge>}
    </span>
  );
}
