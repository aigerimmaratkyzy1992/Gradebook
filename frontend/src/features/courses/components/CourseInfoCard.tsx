import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { ICourse } from "@/types";

interface ICourseInfoCardProps {
  course: Pick<ICourse, "description">;
}

/** Студентке дисциплина сипаттамасы (преподаватель оны баптаулар формасында көреді). */
export function CourseInfoCard({ course }: ICourseInfoCardProps) {
  if (!course.description) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>О дисциплине</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed whitespace-pre-line">{course.description}</p>
      </CardContent>
    </Card>
  );
}
