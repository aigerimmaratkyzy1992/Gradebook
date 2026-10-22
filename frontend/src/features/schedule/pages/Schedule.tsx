import { CalendarDays } from "lucide-react";
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
import { useGroupList } from "@/hooks/useGroupList";
import { api } from "@/lib/api";
import { getIsStaff } from "@/lib/permissions";
import { useCurrentUser } from "@/providers/SessionProvider";
import type { ILesson } from "@/types";

import { LessonEditDialog } from "../components/LessonEditDialog";
import { LessonForm } from "../components/LessonForm";
import { WeekView } from "../components/WeekView";
import { useSchedule } from "../hooks/useSchedule";
import type { LessonSlot } from "../types";

export default function Schedule() {
  const user = useCurrentUser();
  const isStaff = getIsStaff(user.role);
  const { data: lessons, isLoading, error, reload } = useSchedule();
  const courseList = useCourseList(isStaff);
  const groupList = useGroupList(isStaff);
  const courses = courseList.data;
  const groups = groupList.data;
  const isOptionsLoading = courseList.isLoading || groupList.isLoading;
  const optionsError = courseList.error || groupList.error;
  const [editingLesson, setEditingLesson] = useState<ILesson | null>(null);

  async function handleCreate(slot: LessonSlot, courseId: number) {
    await api("/api/schedule", {
      method: "POST",
      body: JSON.stringify({ course_id: courseId, ...slot }),
    });
    toast.success("Занятие добавлено");
    await reload();
  }

  async function handleUpdate(slot: LessonSlot) {
    if (!editingLesson) return;

    await api(`/api/schedule/${editingLesson.id}`, {
      method: "PATCH",
      body: JSON.stringify(slot),
    });
    setEditingLesson(null);
    toast.success("Изменения сохранены");
    await reload();
  }

  async function handleDelete(lessonId: number) {
    await api(`/api/schedule/${lessonId}`, { method: "DELETE" });
    toast.success("Занятие удалено");
    await reload();
  }

  if (isLoading) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        title="Расписание"
        description={
          isStaff
            ? "Еженедельные занятия по дисциплинам и группам"
            : "Занятия ваших групп на неделю"
        }
      />

      <div className="space-y-6">
        {isStaff && (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Новое занятие</CardTitle>
                <CardDescription>
                  Занятие повторяется каждую неделю в выбранный день.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <FormError message={optionsError} />
              {isOptionsLoading && <PageSkeleton />}
              {!isOptionsLoading && !optionsError && (
                <LessonForm
                  courses={courses}
                  groups={groups}
                  submitLabel="Добавить"
                  shouldResetOnSuccess
                  onSubmit={handleCreate}
                />
              )}
            </CardContent>
          </Card>
        )}

        <FormError message={error} />

        {lessons.length === 0 ? (
          <Card>
            <EmptyState
              icon={CalendarDays}
              title="Расписание пока пустое"
              description={
                isStaff
                  ? "Добавьте первое занятие в форме выше."
                  : "Когда преподаватель добавит занятия, они появятся здесь."
              }
            />
          </Card>
        ) : (
          <WeekView
            lessons={lessons}
            canManage={isStaff}
            onEdit={setEditingLesson}
            onDelete={handleDelete}
          />
        )}
      </div>

      {isStaff && !isOptionsLoading && !optionsError && (
        <LessonEditDialog
          lesson={editingLesson}
          courses={courses}
          groups={groups}
          onClose={() => setEditingLesson(null)}
          onSubmit={handleUpdate}
        />
      )}
    </>
  );
}
