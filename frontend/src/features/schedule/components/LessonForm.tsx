import { useId, useState, type FormEvent } from "react";
import { Link } from "react-router";

import { FormError } from "@/components/shared/FormError";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { ROUTES } from "@/constants/routes";
import { getErrorMessage } from "@/lib/api";
import { readFormText, readOptionalFormText } from "@/lib/form";
import type { GroupBrief, ICourse, ILesson } from "@/types";

import { useLessonSelection } from "../hooks/useLessonSelection";
import type { LessonSlot } from "../types";
import { LessonTimeFields } from "./LessonTimeFields";

interface ILessonFormProps {
  /** Берілсе — өңдеу режимі: дисциплина ауыспайды. */
  lesson?: ILesson;
  courses: Pick<ICourse, "id" | "name" | "groups">[];
  groups: GroupBrief[];
  submitLabel: string;
  shouldResetOnSuccess?: boolean;
  onSubmit: (slot: LessonSlot, courseId: number) => Promise<void>;
  onCancel?: () => void;
}

export function LessonForm({
  lesson,
  courses,
  groups,
  submitLabel,
  shouldResetOnSuccess = false,
  onSubmit,
  onCancel,
}: ILessonFormProps) {
  const id = useId();
  const selection = useLessonSelection(lesson, courses, groups);
  const { courseId, groupId, selectedCourse, availableGroups } = selection;
  // Уақыт өрістерін қайта орнату үшін: дисциплина/топ таңдауы сақталады.
  const [timeFieldsKey, setTimeFieldsKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = lesson !== undefined;
  const hasGroups = availableGroups.length > 0;
  const shouldShowNoGroupsHint = !isEditing && selectedCourse !== undefined && !hasGroups;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setError("");
    setIsSaving(true);
    try {
      await onSubmit(
        {
          group_id: Number(groupId),
          weekday: Number(data.get("weekday")),
          starts_at: readFormText(data, "starts_at"),
          ends_at: readFormText(data, "ends_at"),
          room: readOptionalFormText(data, "room"),
        },
        Number(courseId),
      );
      if (shouldResetOnSuccess) setTimeFieldsKey((key) => key + 1);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="@container space-y-4">
      <div className="grid gap-4 @md:grid-cols-2 @2xl:grid-cols-3">
        {!isEditing && (
          <Field label="Дисциплина" htmlFor={`${id}-course`}>
            <NativeSelect
              id={`${id}-course`}
              name="course_id"
              value={courseId}
              onChange={(event) => selection.setCourseId(event.target.value)}
              required
            >
              {courses.length === 0 && <option value="">Нет дисциплин</option>}
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
        )}
        <Field label="Группа" htmlFor={`${id}-group`}>
          <NativeSelect
            id={`${id}-group`}
            name="group_id"
            value={groupId}
            onChange={(event) => selection.setGroupId(event.target.value)}
            required
          >
            {!hasGroups && <option value="">Нет групп у дисциплины</option>}
            {availableGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <LessonTimeFields key={timeFieldsKey} idPrefix={id} lesson={lesson} />
      </div>

      {shouldShowNoGroupsHint && <NoGroupsHint course={selectedCourse} />}

      <FormError message={error} />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
            Отмена
          </Button>
        )}
        <Button type="submit" isLoading={isSaving} disabled={!hasGroups}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

/** Дисциплинаға әлі топ тағайындалмаған — қайда барып тағайындауды көрсетеміз. */
function NoGroupsHint({ course }: { course: Pick<ICourse, "id" | "name"> }) {
  return (
    <p className="text-sm text-muted-foreground">
      У дисциплины «{course.name}» нет групп. Прикрепите её к группе в{" "}
      <Link
        to={ROUTES.course(course.id)}
        className="font-medium text-foreground underline underline-offset-2"
      >
        настройках дисциплины
      </Link>{" "}
      — после этого группа появится в списке.
    </p>
  );
}
