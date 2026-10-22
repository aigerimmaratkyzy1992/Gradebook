import { useApiResource } from "@/hooks/useApiResource";
import type { ILesson } from "@/types";

const NO_LESSONS: ILesson[] = [];

/** Рөлге қарай сүзгіні backend жасайды: студент өз топтарының сабақтарын көреді. */
export function useSchedule() {
  return useApiResource("/api/schedule", NO_LESSONS);
}
