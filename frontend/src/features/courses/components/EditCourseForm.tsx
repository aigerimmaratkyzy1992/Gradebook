import { Trash2 } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

import { ConfirmAction } from "@/components/shared/ConfirmAction";
import { FormError } from "@/components/shared/FormError";
import { TeacherSelect } from "@/components/shared/TeacherSelect";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useTeachers } from "@/hooks/useTeachers";
import { getErrorMessage } from "@/lib/api";
import { parseOptionalId, readFormText, readOptionalFormText } from "@/lib/form";
import { getCanAssignTeacher } from "@/lib/permissions";
import { useCurrentUser } from "@/providers/SessionProvider";
import type { CourseDetail } from "@/types";

import { useCourseSettings } from "../hooks/useCourseSettings";
import { EditCourseGroups } from "./EditCourseGroups";

interface IEditCourseFormProps {
  course: CourseDetail;
  onSaved: (course: CourseDetail) => void;
}

/** Дисциплина баптаулары: атауы, преподаватель (тек admin), сипаттама, топтар. */
export function EditCourseForm({ course, onSaved }: IEditCourseFormProps) {
  const id = useId();
  const user = useCurrentUser();
  const canAssignTeacher = getCanAssignTeacher(user.role);
  const teachers = useTeachers(canAssignTeacher);
  const { save, remove } = useCourseSettings(course.id, onSaved);
  const [teacherId, setTeacherId] = useState(String(course.teacher?.id ?? ""));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setError("");
    setIsSaving(true);
    try {
      await save({
        name: readFormText(data, "name"),
        description: readOptionalFormText(data, "description"),
        group_ids: data.getAll("group_ids").map(Number),
        ...(canAssignTeacher ? { teacher_id: parseOptionalId(teacherId) } : {}),
      });
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Настройки</CardTitle>
          <CardDescription>Название, описание и группы дисциплины</CardDescription>
        </div>
      </CardHeader>
      <form onSubmit={(event) => void handleSubmit(event)}>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Название" htmlFor={`${id}-name`}>
              <Input id={`${id}-name`} name="name" defaultValue={course.name} required />
            </Field>
            {canAssignTeacher && (
              <Field label="Преподаватель" htmlFor={`${id}-teacher`}>
                <TeacherSelect
                  id={`${id}-teacher`}
                  teachers={teachers}
                  currentTeacher={course.teacher}
                  value={teacherId}
                  onChange={setTeacherId}
                />
              </Field>
            )}
          </div>
          <Field label="Описание" htmlFor={`${id}-description`}>
            <Textarea
              id={`${id}-description`}
              name="description"
              defaultValue={course.description ?? ""}
              rows={3}
            />
          </Field>
          <EditCourseGroups selected={course.groups} />
          <FormError message={error} />
        </CardContent>
        <CardFooter className="flex-wrap">
          <Button type="submit" isLoading={isSaving}>
            Сохранить
          </Button>
          <ConfirmAction
            title={`Удалить дисциплину «${course.name}»?`}
            description="Темы, задания и тесты дисциплины будут удалены."
            onConfirm={remove}
          >
            <Button type="button" variant="ghost" className="ml-auto hover:text-destructive">
              <Trash2 aria-hidden />
              Удалить дисциплину
            </Button>
          </ConfirmAction>
        </CardFooter>
      </form>
    </Card>
  );
}
