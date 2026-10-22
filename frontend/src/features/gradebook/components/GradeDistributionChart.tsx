import { useId } from "react";

import { getGradeDistribution } from "../utils";

import { BarList } from "./BarList";

interface IGradeDistributionChartProps {
  /** Бағаланған жұмыстардың пайыздары (getScorePercents). */
  percents: number[];
}

export function GradeDistributionChart({ percents }: IGradeDistributionChartProps) {
  const titleId = useId();
  const bars = getGradeDistribution(percents);

  return (
    <div>
      <h3 id={titleId} className="mb-1 text-sm font-medium">
        Распределение оценок
      </h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Количество работ · всего оценено {percents.length}
      </p>
      <BarList bars={bars} barClassName="bg-chart-2" labelledBy={titleId} />
    </div>
  );
}
