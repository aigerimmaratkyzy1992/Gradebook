import { useId } from "react";

import type { IGradebook } from "@/types";

import { getAverageByAssignment } from "../utils";

import { BarList } from "./BarList";

export function AverageByAssignmentChart({ book }: { book: IGradebook }) {
  const titleId = useId();
  const bars = getAverageByAssignment(book);

  return (
    <div>
      <h3 id={titleId} className="mb-1 text-sm font-medium">
        Средний балл по заданиям
      </h3>
      <p className="mb-4 text-xs text-muted-foreground">В процентах от максимума задания</p>
      <BarList bars={bars} labelledBy={titleId} />
    </div>
  );
}
