import { useApiResource } from "@/hooks/useApiResource";
import type { IStudentWork } from "@/types";

const NO_WORKS: IStudentWork[] = [];

/** Курс топтарындағы барлық студент және олардың осы тапсырма бойынша жұмысы. */
export function useStudentWorks(assignmentId: number) {
  const { data, isLoading, error, reload } = useApiResource(
    `/api/assignments/${assignmentId}/submissions`,
    NO_WORKS,
  );
  return { rows: data, isLoading, error, reload };
}
