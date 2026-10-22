import type { GroupBrief } from "./group";
import type { ITestBrief } from "./test";
import type { IUser } from "./user";

export interface IFileMeta {
  id: number;
  filename: string;
  size: number;
}

export interface IAssignment {
  id: number;
  topic_id: number;
  title: string;
  description: string | null;
  material_url: string | null;
  criteria: string | null;
  due_at: string | null;
  max_score: number;
  files: IFileMeta[];
  created_at: string;
}

export type AssignmentDetail = IAssignment & {
  topic_title: string;
  course_id: number;
  course_name: string;
};

export interface ITopic {
  id: number;
  course_id: number;
  title: string;
  position: number;
  assignments: IAssignment[];
  tests: ITestBrief[];
}

export interface ICourse {
  id: number;
  name: string;
  description: string | null;
  teacher: IUser | null;
  groups: GroupBrief[];
  created_at: string;
}

export type CourseDetail = ICourse & { topics: ITopic[] };

export type CourseBrief = Pick<ICourse, "id" | "name">;
