import type { ICourse } from "@/types";

import { useApiResource, type IApiResource } from "./useApiResource";

const NO_COURSES: ICourse[] = [];

/**
 * Дисциплиналар тізімі. Рөлге қарай сүзгіні backend жасайды: студент өз
 * топтарының дисциплиналарын көреді. Дисциплиналар беті мен кесте формасына ортақ.
 */
export function useCourseList(shouldFetch = true): IApiResource<ICourse[]> {
  return useApiResource(shouldFetch ? "/api/courses" : null, NO_COURSES);
}
