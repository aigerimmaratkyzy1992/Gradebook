import { useApiResource } from "@/hooks/useApiResource";
import type { AssignmentDetail } from "@/types";

/** Тапсырманы жүктейді; `reload` — өзгерістен кейін қайта сұрау үшін. */
export function useAssignment(id: string) {
  const { data: assignment, error, reload } = useApiResource<AssignmentDetail | null>(
    `/api/assignments/${id}`,
    null,
  );
  return { assignment, error, reload };
}
