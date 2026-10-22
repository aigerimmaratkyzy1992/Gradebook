import { BookOpen } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormError } from "@/components/shared/FormError";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useCourseList } from "@/hooks/useCourseList";
import { useTeachers } from "@/hooks/useTeachers";
import { api } from "@/lib/api";
import { getCanAssignTeacher, getIsStaff } from "@/lib/permissions";
import { useCurrentUser } from "@/providers/SessionProvider";
import type { INameTeacherValues } from "@/types";

import { CourseCard } from "../components/CourseCard";
import { CourseCardEditForm } from "../components/CourseCardEditForm";
import { CreateCourseForm } from "../components/CreateCourseForm";

export default function Courses() {
  const user = useCurrentUser();
  const isStaff = getIsStaff(user.role);
  const canAssignTeacher = getCanAssignTeacher(user.role);
  const teachers = useTeachers(canAssignTeacher);
  const { data: courses, isLoading, error, reload } = useCourseList();
  const [editingId, setEditingId] = useState<number | null>(null);

  async function handleCreate(values: INameTeacherValues) {
    await api("/api/courses", { method: "POST", body: JSON.stringify(values) });
    toast.success("Дисциплина создана");
    await reload();
  }

  async function handleUpdate(courseId: number, values: INameTeacherValues) {
    await api(`/api/courses/${courseId}`, {
      method: "PATCH",
      // Преподавательді тек admin ауыстырады — басқаларда өрісті мүлде жібермейміз.
      body: JSON.stringify({
        name: values.name,
        ...(canAssignTeacher ? { teacher_id: values.teacher_id } : {}),
      }),
    });
    setEditingId(null);
    toast.success("Изменения сохранены");
    await reload();
  }

  async function handleDelete(courseId: number) {
    await api(`/api/courses/${courseId}`, { method: "DELETE" });
    toast.success("Дисциплина удалена");
    await reload();
  }

  if (isLoading) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        title="Дисциплины"
        description={
          isStaff ? "Дисциплины, их преподаватели и группы" : "Дисциплины ваших групп"
        }
      />

      <div className="space-y-6">
        {isStaff && (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Новая дисциплина</CardTitle>
                <CardDescription>
                  Темы, задания и группы настраиваются на странице дисциплины.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <CreateCourseForm
                teachers={teachers}
                canAssignTeacher={canAssignTeacher}
                onCreate={handleCreate}
              />
            </CardContent>
          </Card>
        )}

        <FormError message={error} />

        {courses.length === 0 ? (
          <Card>
            <EmptyState
              icon={BookOpen}
              title={
                isStaff ? "Пока нет ни одной дисциплины" : "Вам пока не назначены дисциплины"
              }
              description={
                isStaff
                  ? "Создайте первую дисциплину в форме выше."
                  : "Дисциплины появятся, когда их прикрепят к вашей группе."
              }
            />
          </Card>
        ) : (
          <section aria-label="Все дисциплины">
            <ul className="grid gap-4 sm:grid-cols-2">
              {courses.map((course) => (
                <li key={course.id}>
                  {editingId === course.id ? (
                    <Card className="h-full p-5">
                      <CourseCardEditForm
                        course={course}
                        teachers={teachers}
                        canAssignTeacher={canAssignTeacher}
                        onSubmit={(values) => handleUpdate(course.id, values)}
                        onCancel={() => setEditingId(null)}
                      />
                    </Card>
                  ) : (
                    <CourseCard
                      course={course}
                      canManage={isStaff}
                      onEdit={() => setEditingId(course.id)}
                      onDelete={() => handleDelete(course.id)}
                    />
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
