import type { CourseBrief } from "./course";
import type { GroupBrief } from "./group";

export interface ILesson {
  id: number;
  weekday: number;
  starts_at: string;
  ends_at: string;
  room: string | null;
  course: CourseBrief;
  group: GroupBrief;
}
