import { getPercent } from "@/lib/score";
import type { IGradebook } from "@/types";

import { GRADE_BUCKETS } from "./constants";

export interface IBar {
  key: string;
  label: string;
  /** Жолақ ұзындығы, 0–100. */
  percent: number;
  caption: string;
}

function getAverage(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/** Әр тапсырма бойынша орташа балл, максимумнан пайызбен. */
export function getAverageByAssignment(book: IGradebook): IBar[] {
  return book.columns.map((column, index) => {
    const scores = book.rows
      .map((row) => row.cells[index].score)
      .filter((score): score is number => score !== null);
    const average = getAverage(scores);
    const percent = average === null ? 0 : getPercent(average, column.max_score);

    return {
      key: String(column.id),
      label: column.title,
      percent,
      caption: `${percent}%`,
    };
  });
}

/** Барлық бағаланған жұмыстың пайызы (тапсырманың максимумына қатысты). */
export function getScorePercents(book: IGradebook): number[] {
  return book.rows.flatMap((row) =>
    row.cells.flatMap((cell, index) =>
      cell.score === null ? [] : [(cell.score / book.columns[index].max_score) * 100],
    ),
  );
}

/** Пайыздарды шкала бөліктеріне таратады: жолақ — үлес, жазу — саны. */
export function getGradeDistribution(percents: number[]): IBar[] {
  return GRADE_BUCKETS.map((bucket, index) => {
    const upper = index === 0 ? Infinity : GRADE_BUCKETS[index - 1].min;
    const count = percents.filter((value) => value >= bucket.min && value < upper).length;

    return {
      key: bucket.label,
      label: bucket.label,
      percent: percents.length ? (count / percents.length) * 100 : 0,
      caption: String(count),
    };
  });
}
