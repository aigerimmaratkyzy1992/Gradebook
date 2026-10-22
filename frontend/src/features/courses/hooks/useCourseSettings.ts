import { useNavigate } from "react-router";
import { toast } from "sonner";

import { ROUTES } from "@/constants/routes";
import { api } from "@/lib/api";
import type { CourseDetail } from "@/types";

/** PATCH денесі: `teacher_id` жоқ болса, сервер преподавательді өзгертпейді. */
type CourseSettingsPayload = Pick<CourseDetail, "name" | "description"> & {
  group_ids: number[];
  teacher_id?: number | null;
};

/** Дисциплина баптауларының мутациялары. Қате шақырушыға (формаға) лақтырылады. */
export function useCourseSettings(courseId: number, onSaved: (course: CourseDetail) => void) {
  const navigate = useNavigate();

  async function save(payload: CourseSettingsPayload) {
    const updated = await api<CourseDetail>(`/api/courses/${courseId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    onSaved(updated);
    toast.success("Сохранено");
  }

  async function remove() {
    await api(`/api/courses/${courseId}`, { method: "DELETE" });
    toast.success("Дисциплина удалена");
    navigate(ROUTES.courses, { replace: true });
  }

  return { save, remove };
}
