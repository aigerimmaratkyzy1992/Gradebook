import { PLURAL_FORMS, pluralize } from "@/lib/plural";
import { getTeacherLabel } from "@/lib/utils";
import type { GroupBrief, ICourse, ITopic } from "@/types";

/**
 * Дисциплина формасындағы топ нұсқалары: жүктелген тізім + қазір тағайындалған,
 * бірақ тізімде жоқ топтар. Преподавательдің `/api/groups`-ында тек өз топтары
 * бар; admin қосқан бөтен топ опция болмаса, сақтағанда `group_ids`-тен түсіп,
 * дисциплинадан ажырап кетер еді.
 */
export function getCourseGroupOptions(
  loaded: GroupBrief[],
  attached: GroupBrief[],
): GroupBrief[] {
  const missing = attached.filter((group) => !loaded.some((item) => item.id === group.id));
  return [...loaded, ...missing];
}

/** «Преподаватель: … · группы» — бет тақырыбының астындағы жол. */
export function getCourseSubtitle({ teacher, groups }: Pick<ICourse, "teacher" | "groups">): string {
  const groupsLabel = groups.map((group) => group.name).join(", ") || "нет групп";
  return `${getTeacherLabel(teacher)} · ${groupsLabel}`;
}

/** «3 задания · 1 тест» — тақырып атауының астындағы жол (тест жоқ болса — тек тапсырмалар). */
export function getTopicSummary({ assignments, tests }: Pick<ITopic, "assignments" | "tests">): string {
  const parts = [pluralize(assignments.length, PLURAL_FORMS.assignment)];
  if (tests.length > 0) parts.push(pluralize(tests.length, PLURAL_FORMS.test));
  return parts.join(" · ");
}
