import type { IUser } from "./user";

export interface IGroup {
  id: number;
  name: string;
  teacher: IUser | null;
  students_count: number;
  created_at: string;
}

export type GroupDetail = IGroup & { students: IUser[] };

export type GroupBrief = Pick<IGroup, "id" | "name">;
