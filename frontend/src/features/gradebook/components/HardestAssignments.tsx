import { ChevronRight } from "lucide-react";
import { useId } from "react";
import { Link } from "react-router";

import { ROUTES } from "@/constants/routes";
import type { IHardestAssignment } from "@/types";

export function HardestAssignments({ hardest }: { hardest: IHardestAssignment[] }) {
  const titleId = useId();

  return (
    <div>
      <h3 id={titleId} className="mb-3 text-sm font-medium">
        Самые сложные задания
      </h3>
      <ul aria-labelledby={titleId} className="divide-y divide-border rounded-lg border border-border">
        {hardest.map((item) => (
          <li key={item.id}>
            <Link
              to={ROUTES.assignment(item.id)}
              className="group flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-accent"
            >
              <span className="min-w-0 flex-1 truncate">{item.title}</span>
              <span className="font-medium tabular-nums">{item.average_percent}%</span>
              <ChevronRight
                className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
