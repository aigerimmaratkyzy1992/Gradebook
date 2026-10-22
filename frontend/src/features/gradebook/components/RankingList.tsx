import { useId } from "react";

import { getDisplayName } from "@/lib/utils";
import type { IRankingEntry } from "@/types";

import { RANKING_LIMIT } from "../constants";

export function RankingList({ ranking }: { ranking: IRankingEntry[] }) {
  const titleId = useId();
  const topEntries = ranking.slice(0, RANKING_LIMIT);

  return (
    <div>
      <h3 id={titleId} className="mb-3 text-sm font-medium">
        Рейтинг студентов
      </h3>
      <ol aria-labelledby={titleId} className="divide-y divide-border rounded-lg border border-border">
        {topEntries.map((entry, index) => (
          <li key={entry.student.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
            <span className="w-5 text-muted-foreground tabular-nums">{index + 1}</span>
            <span className="min-w-0 flex-1 truncate">{getDisplayName(entry.student)}</span>
            <span className="font-medium tabular-nums">{entry.average}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
