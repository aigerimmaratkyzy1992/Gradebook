import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/PageHeader";
import { ConfirmAction } from "@/components/shared/ConfirmAction";
import { FormError } from "@/components/shared/FormError";
import { Button } from "@/components/ui/Button";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/constants/routes";
import { api } from "@/lib/api";
import { getIsStaff, getIsStudent } from "@/lib/permissions";
import { useCurrentUser } from "@/providers/SessionProvider";

import { AssignmentInfoCard } from "../components/AssignmentInfoCard";
import { EditAssignmentForm } from "../components/EditAssignmentForm";
import { MyWork } from "../components/MyWork";
import { WorkReview } from "../components/WorkReview";
import { useAssignment } from "../hooks/useAssignment";

export default function AssignmentDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const { assignment, error, reload } = useAssignment(id);
  const [isEditing, setIsEditing] = useState(false);

  const canManage = getIsStaff(user.role);
  const isStudent = getIsStudent(user.role);

  if (!assignment) {
    if (!error) return <PageSkeleton />;

    return (
      <>
        <PageHeader title="Задание" back={{ to: ROUTES.courses, label: "Дисциплины" }} />
        <FormError message={error} />
      </>
    );
  }

  const courseId = assignment.course_id;
  const canShowActions = canManage && !isEditing;

  async function handleDelete() {
    await api(`/api/assignments/${id}`, { method: "DELETE" });
    toast.success("Задание удалено");
    navigate(ROUTES.course(courseId), { replace: true });
  }

  async function handleSaved() {
    setIsEditing(false);
    await reload();
  }

  return (
    <>
      <PageHeader
        title={assignment.title}
        description={`${assignment.course_name} · Тема: ${assignment.topic_title}`}
        back={{ to: ROUTES.course(courseId), label: assignment.course_name }}
        actions={
          canShowActions && (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil aria-hidden />
                Изменить
              </Button>
              <ConfirmAction
                title={`Удалить задание «${assignment.title}»?`}
                description="Действие нельзя отменить."
                onConfirm={handleDelete}
              >
                <Button variant="outline" size="sm" className="hover:text-destructive">
                  <Trash2 aria-hidden />
                  Удалить
                </Button>
              </ConfirmAction>
            </>
          )
        }
      />

      <div className="space-y-6">
        <FormError message={error} />

        {isEditing ? (
          <EditAssignmentForm
            assignment={assignment}
            onSaved={handleSaved}
            onCancel={() => setIsEditing(false)}
            onFilesChanged={reload}
          />
        ) : (
          <>
            <AssignmentInfoCard assignment={assignment} />
            {isStudent && <MyWork assignmentId={assignment.id} />}
            {canManage && (
              <WorkReview assignmentId={assignment.id} maxScore={assignment.max_score} />
            )}
          </>
        )}
      </div>
    </>
  );
}
