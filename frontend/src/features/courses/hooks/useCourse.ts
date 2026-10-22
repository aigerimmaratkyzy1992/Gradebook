import { useApiResource } from "@/hooks/useApiResource";
import type { CourseDetail } from "@/types";

/** Дисциплинаның толық ағашы (тақырыптар + тапсырмалар + тестілер). */
export function useCourse(id: string) {
  const { data: course, setData: setCourse, error, reload } = useApiResource<CourseDetail | null>(
    `/api/courses/${id}`,
    null,
  );
  return { course, setCourse, error, reload };
}
