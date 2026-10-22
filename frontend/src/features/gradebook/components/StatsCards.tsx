import { FileCheck, Gauge, TrendingUp, Users } from "lucide-react";

import { StatTile, type IStatTile } from "@/components/shared/StatTile";
import type { ICourseStats } from "@/types";

type CourseSummary = Pick<
  ICourseStats,
  "students" | "submitted" | "expected" | "average" | "completion_percent"
>;

function buildTiles(stats: CourseSummary): IStatTile[] {
  return [
    { label: "Студентов", value: stats.students, icon: Users },
    { label: "Сдано работ", value: `${stats.submitted} из ${stats.expected}`, icon: FileCheck },
    { label: "Средний балл", value: stats.average ?? "—", icon: Gauge },
    { label: "Успеваемость", value: `${stats.completion_percent}%`, icon: TrendingUp },
  ];
}

export function StatsCards({ stats }: { stats: CourseSummary }) {
  return (
    <dl aria-label="Сводка по дисциплине" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {buildTiles(stats).map((tile) => (
        <StatTile key={tile.label} {...tile} />
      ))}
    </dl>
  );
}
