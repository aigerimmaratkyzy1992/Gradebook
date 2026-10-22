import type { IAssignment } from "./course";
import type { SubmissionStatus } from "./submission";
import type { IUser } from "./user";

export interface IGradebookColumn {
  id: number;
  title: string;
  topic_title: string;
  max_score: number;
}

export interface IGradebookCell {
  assignment_id: number;
  score: number | null;
  status: SubmissionStatus | null;
}

export interface IGradebookRow {
  student: IUser;
  cells: IGradebookCell[];
  average: number | null;
  total: number;
}

export interface IGradebook {
  columns: IGradebookColumn[];
  rows: IGradebookRow[];
}

export interface ICourseStats {
  students: number;
  assignments: number;
  expected: number;
  submitted: number;
  reviewed: number;
  not_submitted: number;
  average: number | null;
  completion_percent: number;
  hardest: IHardestAssignment[];
  ranking: IRankingEntry[];
}

/** Орташа нәтижесі ең төмен тапсырма. */
export interface IHardestAssignment extends Pick<IAssignment, "id" | "title"> {
  average_percent: number;
}

export interface IRankingEntry {
  student: IUser;
  average: number;
}
