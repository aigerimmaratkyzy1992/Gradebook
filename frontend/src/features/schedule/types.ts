import type { ILesson } from "@/types";

/** Сабақ формасының мәндері: POST-та `course_id` қосылады, PATCH-та дисциплина ауыспайды. */
export type LessonSlot = Pick<ILesson, "weekday" | "starts_at" | "ends_at" | "room"> & {
  group_id: number;
};
