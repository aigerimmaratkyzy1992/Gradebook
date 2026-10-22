import { useNavigate } from "react-router";
import { toast } from "sonner";

import { ROUTES } from "@/constants/routes";
import { api } from "@/lib/api";
import type { GroupDetail, INameTeacherValues } from "@/types";

/**
 * Топ бетінің мутациялары. Сервер әр өзгерістен кейін толық топты қайтарады —
 * қайта сұрамай, `setGroup` арқылы жаңартамыз. Қате шақырушыға лақтырылады.
 */
export function useGroupMutations(
  groupId: string | undefined,
  setGroup: (group: GroupDetail) => void,
) {
  const navigate = useNavigate();

  async function save(values: INameTeacherValues) {
    setGroup(
      await api<GroupDetail>(`/api/groups/${groupId}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    );
    toast.success("Изменения сохранены");
  }

  async function addStudent(email: string) {
    setGroup(
      await api<GroupDetail>(`/api/groups/${groupId}/students`, {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    );
    toast.success("Студент добавлен в группу");
  }

  async function removeStudent(studentId: number) {
    setGroup(
      await api<GroupDetail>(`/api/groups/${groupId}/students/${studentId}`, {
        method: "DELETE",
      }),
    );
    toast.success("Студент убран из группы");
  }

  async function deleteGroup() {
    await api(`/api/groups/${groupId}`, { method: "DELETE" });
    toast.success("Группа удалена");
    navigate(ROUTES.groups, { replace: true });
  }

  return { save, addStudent, removeStudent, deleteGroup };
}
