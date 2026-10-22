import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { formatTime } from "@/lib/date";
import type { ILesson } from "@/types";

import { WEEKDAYS } from "../constants";

interface ILessonTimeFieldsProps {
  idPrefix: string;
  lesson?: Pick<ILesson, "weekday" | "starts_at" | "ends_at" | "room">;
}

/**
 * Күн, уақыт және аудитория — басқарылмайтын өрістер (FormData арқылы оқылады).
 * Формаға `key` арқылы қайта орнатылады: сақтағаннан кейін тазаланады, ал
 * дисциплина мен топ таңдауы сақталып қалады.
 */
export function LessonTimeFields({ idPrefix, lesson }: ILessonTimeFieldsProps) {
  return (
    <>
      <Field label="День недели" htmlFor={`${idPrefix}-weekday`}>
        <NativeSelect
          id={`${idPrefix}-weekday`}
          name="weekday"
          defaultValue={lesson?.weekday ?? 0}
        >
          {WEEKDAYS.map((day, index) => (
            <option key={day} value={index}>
              {day}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Начало" htmlFor={`${idPrefix}-start`}>
        <Input
          id={`${idPrefix}-start`}
          type="time"
          name="starts_at"
          defaultValue={lesson ? formatTime(lesson.starts_at) : undefined}
          required
        />
      </Field>
      <Field label="Конец" htmlFor={`${idPrefix}-end`}>
        <Input
          id={`${idPrefix}-end`}
          type="time"
          name="ends_at"
          defaultValue={lesson ? formatTime(lesson.ends_at) : undefined}
          required
        />
      </Field>
      <Field label="Аудитория" htmlFor={`${idPrefix}-room`}>
        <Input
          id={`${idPrefix}-room`}
          name="room"
          defaultValue={lesson?.room ?? ""}
          placeholder="Например, 305"
        />
      </Field>
    </>
  );
}
