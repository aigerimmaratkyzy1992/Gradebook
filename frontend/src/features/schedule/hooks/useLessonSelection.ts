import { useState } from "react";

import type { GroupBrief, ICourse, ILesson } from "@/types";

import { getAvailableGroups } from "../utils";

/**
 * Сабақ формасындағы дисциплина → топ таңдауы (екеуі де басқарылатын өріс).
 * Өңдеуде сабақтың өз мәндерімен басталады: тізімдер кеш жүктелсе де select
 * бірінші опцияға түсіп, сабақты басқа топқа көшірмейді.
 */
export function useLessonSelection(
  lesson: Pick<ILesson, "course" | "group"> | undefined,
  courses: Pick<ICourse, "id" | "name" | "groups">[],
  groups: GroupBrief[],
) {
  const [pickedCourseId, setPickedCourseId] = useState(lesson ? String(lesson.course.id) : "");
  const [pickedGroupId, setPickedGroupId] = useState(lesson ? String(lesson.group.id) : "");

  // Таңдау жасалмаса — тізімдегі бірінші дисциплина (тізім кеш жүктеледі).
  const courseId = pickedCourseId || String(courses[0]?.id ?? "");
  const selectedCourse = courses.find((course) => String(course.id) === courseId);
  const availableGroups = getAvailableGroups(selectedCourse, groups, lesson?.group);
  // Таңдалған топ тізімнен шығып қалса (дисциплина ауысқанда) — біріншісі.
  const isPickedGroupAvailable = availableGroups.some(
    (group) => String(group.id) === pickedGroupId,
  );
  const groupId = isPickedGroupAvailable ? pickedGroupId : String(availableGroups[0]?.id ?? "");

  return {
    courseId,
    groupId,
    selectedCourse,
    availableGroups,
    setCourseId: setPickedCourseId,
    setGroupId: setPickedGroupId,
  };
}
