import { Users } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormError } from "@/components/shared/FormError";
import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardList,
  CardTitle,
} from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { FADE_ITEM_MOTION } from "@/constants/motion";
import { useGroupList } from "@/hooks/useGroupList";
import { useTeachers } from "@/hooks/useTeachers";
import { api } from "@/lib/api";
import { getCanAssignTeacher } from "@/lib/permissions";
import { useCurrentUser } from "@/providers/SessionProvider";
import type { INameTeacherValues } from "@/types";

import { GroupForm } from "../components/GroupForm";
import { GroupRow } from "../components/GroupRow";

export default function Groups() {
  const user = useCurrentUser();
  const canAssignTeacher = getCanAssignTeacher(user.role);
  const teachers = useTeachers(canAssignTeacher);
  const { data: groups, isLoading, error, reload } = useGroupList();
  const [editingId, setEditingId] = useState<number | null>(null);

  async function handleCreate(values: INameTeacherValues) {
    await api("/api/groups", { method: "POST", body: JSON.stringify(values) });
    toast.success("Группа создана");
    await reload();
  }

  async function handleUpdate(groupId: number, values: INameTeacherValues) {
    await api(`/api/groups/${groupId}`, { method: "PATCH", body: JSON.stringify(values) });
    setEditingId(null);
    toast.success("Изменения сохранены");
    await reload();
  }

  async function handleDelete(groupId: number) {
    await api(`/api/groups/${groupId}`, { method: "DELETE" });
    toast.success("Группа удалена");
    await reload();
  }

  if (isLoading) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        title="Группы"
        description="Учебные группы, их преподаватели и состав студентов"
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Новая группа</CardTitle>
              <CardDescription>
                Студентов можно добавить после создания — на странице группы.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <GroupForm
              teachers={teachers}
              canAssignTeacher={canAssignTeacher}
              submitLabel="Создать"
              shouldResetOnSuccess
              onSubmit={handleCreate}
            />
          </CardContent>
        </Card>

        <FormError message={error} />

        <Card>
          <CardHeader>
            <CardTitle>Все группы</CardTitle>
            <CardAction>
              <Badge variant="secondary" className="tabular-nums">
                {groups.length}
              </Badge>
            </CardAction>
          </CardHeader>

          {groups.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Пока нет ни одной группы"
              description="Создайте первую группу в форме выше."
              className="border-t border-border"
            />
          ) : (
            <CardList>
              <AnimatePresence initial={false}>
                {groups.map((group) => (
                  <motion.li key={group.id} layout="position" {...FADE_ITEM_MOTION}>
                    {editingId === group.id ? (
                      <div className="px-5 py-4">
                        <GroupForm
                          defaultValues={group}
                          teachers={teachers}
                          canAssignTeacher={canAssignTeacher}
                          submitLabel="Сохранить"
                          shouldAutoFocus
                          onSubmit={(values) => handleUpdate(group.id, values)}
                          onCancel={() => setEditingId(null)}
                        />
                      </div>
                    ) : (
                      <GroupRow
                        group={group}
                        onEdit={() => setEditingId(group.id)}
                        onDelete={() => handleDelete(group.id)}
                      />
                    )}
                  </motion.li>
                ))}
              </AnimatePresence>
            </CardList>
          )}
        </Card>
      </div>
    </>
  );
}
