export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type AssignmentFilter = "all" | "pending" | "done";

export const ASSIGNMENT_FILTERS = [
  { value: "all", label: "Все" },
  { value: "pending", label: "К сдаче" },
  { value: "done", label: "Сданные" },
] as const satisfies readonly { value: AssignmentFilter; label: string }[];
