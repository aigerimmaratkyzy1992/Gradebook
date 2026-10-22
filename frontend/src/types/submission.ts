import type { AssignmentDetail, IAssignment, IFileMeta } from "./course";
import type { IUser } from "./user";

export type SubmissionStatus = "submitted" | "reviewed" | "revision";

export interface ISubmissionVersion {
  id: number;
  text: string | null;
  link: string | null;
  submitted_at: string;
  files: IFileMeta[];
}

export interface ISubmission {
  id: number;
  assignment_id: number;
  student: IUser;
  status: SubmissionStatus;
  score: number | null;
  comment: string | null;
  reviewed_at: string | null;
  created_at: string;
  versions: ISubmissionVersion[];
}

export interface IStudentWork {
  student: IUser;
  submission: ISubmission | null;
}

/** `/api/my/assignments` жолы: тапсырма + орны + (студентке) өз жұмысының күйі. */
export interface IMyAssignment
  extends Pick<IAssignment, "id" | "title" | "due_at" | "max_score">,
    Pick<AssignmentDetail, "course_id" | "course_name" | "topic_title">,
    Pick<ISubmission, "score" | "comment"> {
  /** null — студент әлі тапсырмаған (немесе пайдаланушы — преподаватель). */
  status: SubmissionStatus | null;
}
