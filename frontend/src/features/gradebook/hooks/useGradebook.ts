import { useApiResource } from "@/hooks/useApiResource";
import type { CourseDetail, ICourseStats, IGradebook } from "@/types";

interface IGradebookData {
  course: CourseDetail;
  book: IGradebook;
  stats: ICourseStats;
}

/**
 * Журнал беті үшін үш сұраныс қатар жіберіледі; әрқайсысы useApiResource арқылы,
 * сондықтан бет жабылса не курс ауысса, кешіккен жауаптар елеусіз қалады.
 */
export function useGradebook(courseId: string | undefined) {
  const basePath = courseId ? `/api/courses/${courseId}` : null;
  const course = useApiResource<CourseDetail | null>(basePath, null);
  const book = useApiResource<IGradebook | null>(basePath && `${basePath}/gradebook`, null);
  const stats = useApiResource<ICourseStats | null>(basePath && `${basePath}/stats`, null);

  const data: IGradebookData | null =
    course.data && book.data && stats.data
      ? { course: course.data, book: book.data, stats: stats.data }
      : null;

  return {
    data,
    isLoading: course.isLoading || book.isLoading || stats.isLoading,
    error: course.error || book.error || stats.error,
  };
}
