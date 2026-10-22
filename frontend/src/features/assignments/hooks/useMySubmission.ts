import { useApiResource } from "@/hooks/useApiResource";
import type { ISubmission } from "@/types";

/** Студенттің осы тапсырма бойынша жұмысы (әлі тапсырмаса — null). */
export function useMySubmission(assignmentId: number) {
  // Қатені әдейі көрсетпейміз: жүктелмесе «Не сдано» күйі қалады,
  // ал тапсыру формасы бәрібір жұмыс істейді.
  const { data: work, setData: setWork, isLoading } = useApiResource<ISubmission | null>(
    `/api/assignments/${assignmentId}/submission`,
    null,
  );
  return { work, setWork, isLoading };
}
