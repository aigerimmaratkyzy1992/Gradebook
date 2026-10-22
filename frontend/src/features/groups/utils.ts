import type { IUser } from "@/types";

/** Топта жоқ студенттер ғана таңдауға шығады — бір студентті екі рет қоспаймыз. */
export function getStudentsOutsideGroup<T extends Pick<IUser, "id">>(
  students: T[],
  members: Pick<IUser, "id">[],
): T[] {
  return students.filter((student) => !members.some((member) => member.id === student.id));
}
