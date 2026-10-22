import { Trash2 } from "lucide-react";
import { useParams } from "react-router";

import { PageHeader } from "@/components/layout/PageHeader";
import { ConfirmAction } from "@/components/shared/ConfirmAction";
import { FormError } from "@/components/shared/FormError";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/constants/routes";
import { useTeachers } from "@/hooks/useTeachers";
import { useUsersByRole } from "@/hooks/useUsersByRole";
import { getCanAssignTeacher } from "@/lib/permissions";
import { getTeacherLabel } from "@/lib/utils";
import { useCurrentUser } from "@/providers/SessionProvider";

import { GroupForm } from "../components/GroupForm";
import { GroupStudentsCard } from "../components/GroupStudentsCard";
import { useGroupDetail } from "../hooks/useGroupDetail";
import { useGroupMutations } from "../hooks/useGroupMutations";
import { getStudentsOutsideGroup } from "../utils";

const BACK_LINK = { to: ROUTES.groups, label: "Группы" } as const;

export default function GroupDetail() {
  const { id } = useParams();
  const user = useCurrentUser();
  const canAssignTeacher = getCanAssignTeacher(user.role);
  const teachers = useTeachers(canAssignTeacher);
  const students = useUsersByRole("student", true);
  const { group, setGroup, isLoading, error } = useGroupDetail(id);
  const { save, addStudent, removeStudent, deleteGroup } = useGroupMutations(id, setGroup);

  if (isLoading) return <PageSkeleton />;

  if (!group) {
    return (
      <>
        <PageHeader title="Группа" back={BACK_LINK} />
        <FormError message={error} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={group.name}
        description={getTeacherLabel(group.teacher)}
        back={BACK_LINK}
        actions={
          <ConfirmAction
            title={`Удалить группу «${group.name}»?`}
            description="Студенты останутся в системе, но будут исключены из группы."
            onConfirm={deleteGroup}
          >
            <Button variant="outline" className="hover:text-destructive">
              <Trash2 aria-hidden />
              Удалить группу
            </Button>
          </ConfirmAction>
        }
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Настройки</CardTitle>
          </CardHeader>
          <CardContent>
            <GroupForm
              defaultValues={group}
              teachers={teachers}
              canAssignTeacher={canAssignTeacher}
              submitLabel="Сохранить"
              onSubmit={save}
            />
          </CardContent>
        </Card>

        <GroupStudentsCard
          members={group.students}
          candidates={getStudentsOutsideGroup(students, group.students)}
          onAdd={addStudent}
          onRemove={removeStudent}
        />
      </div>
    </>
  );
}
