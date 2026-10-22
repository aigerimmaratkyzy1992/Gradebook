import type { IGroup } from "./group";

/**
 * Топ пен дисциплинаны құру/өңдеу формасының мәндері (әрі POST/PATCH денесі):
 * атауы + преподаватель. Преподавательді тек admin таңдайды.
 */
export interface INameTeacherValues extends Pick<IGroup, "name"> {
  teacher_id: number | null;
}
