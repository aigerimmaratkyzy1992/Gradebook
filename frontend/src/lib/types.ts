export type Role = "admin" | "teacher" | "student";

export type User = {
  id: number;
  email: string;
  full_name: string | null;
  role: Role;
  created_at: string;
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Администратор",
  teacher: "Преподаватель",
  student: "Студент",
};

export type Group = {
  id: number;
  name: string;
  teacher: User | null;
  students_count: number;
  created_at: string;
};

export type GroupDetail = Group & { students: User[] };

export type GroupBrief = { id: number; name: string };

export type AssignmentFile = { id: number; filename: string; size: number };

export type Assignment = {
  id: number;
  topic_id: number;
  title: string;
  description: string | null;
  material_url: string | null;
  criteria: string | null;
  due_at: string | null;
  max_score: number;
  files: AssignmentFile[];
  created_at: string;
};

export type Topic = {
  id: number;
  course_id: number;
  title: string;
  position: number;
  assignments: Assignment[];
  tests: TestBrief[];
};

export type Course = {
  id: number;
  name: string;
  description: string | null;
  teacher: User | null;
  groups: GroupBrief[];
  created_at: string;
};

export type CourseDetail = Course & { topics: Topic[] };

export type AssignmentDetail = Assignment & {
  topic_title: string;
  course_id: number;
  course_name: string;
};

export type SubmissionStatus = "submitted" | "reviewed" | "revision";

export type SubmissionFile = { id: number; filename: string; size: number };

export type SubmissionVersion = {
  id: number;
  text: string | null;
  link: string | null;
  submitted_at: string;
  files: SubmissionFile[];
};

export type Submission = {
  id: number;
  assignment_id: number;
  student: User;
  status: SubmissionStatus;
  score: number | null;
  comment: string | null;
  reviewed_at: string | null;
  created_at: string;
  versions: SubmissionVersion[];
};

export type StudentWork = { student: User; submission: Submission | null };

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  submitted: "Сдано",
  reviewed: "Проверено",
  revision: "На доработку",
};

export type GradebookColumn = {
  id: number;
  title: string;
  topic_title: string;
  max_score: number;
};

export type GradebookCell = {
  assignment_id: number;
  score: number | null;
  status: SubmissionStatus | null;
};

export type GradebookRow = {
  student: User;
  cells: GradebookCell[];
  average: number | null;
  total: number;
};

export type GradebookData = {
  columns: GradebookColumn[];
  rows: GradebookRow[];
};

export type CourseStats = {
  students: number;
  assignments: number;
  expected: number;
  submitted: number;
  reviewed: number;
  not_submitted: number;
  average: number | null;
  completion_percent: number;
  hardest: { id: number; title: string; average_percent: number }[];
  ranking: { student: User; average: number }[];
};

export type MyAssignment = {
  id: number;
  title: string;
  due_at: string | null;
  max_score: number;
  course_id: number;
  course_name: string;
  topic_title: string;
  status: SubmissionStatus | null;
  score: number | null;
  comment: string | null;
};

export type QuestionKind = "single" | "multiple" | "true_false" | "match" | "short";

export const KIND_LABELS: Record<QuestionKind, string> = {
  single: "Один правильный",
  multiple: "Несколько правильных",
  true_false: "Правда / Ложь",
  match: "Соответствие",
  short: "Короткий ответ",
};

export type TestBrief = {
  id: number;
  topic_id: number;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  attempts_allowed: number;
  due_at: string | null;
};

export type OptionFull = {
  id: number;
  text: string;
  is_correct: boolean;
  match_text: string | null;
};

export type QuestionFull = {
  id: number;
  kind: QuestionKind;
  text: string;
  position: number;
  points: number;
  options: OptionFull[];
};

export type TestFull = TestBrief & {
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_result: boolean;
  questions: QuestionFull[];
  max_score: number;
};

export type TakeQuestion = {
  id: number;
  kind: QuestionKind;
  text: string;
  points: number;
  options: { id: number; text: string }[];
  match_targets: string[];
};

export type TestTake = {
  id: number;
  title: string;
  description: string | null;
  attempt_id: number;
  deadline: string | null;
  show_result: boolean;
  max_score: number;
  questions: TakeQuestion[];
};

export type AttemptResult = {
  id: number;
  score: number;
  max_score: number;
  finished_at: string | null;
  show_result: boolean;
};

export type AttemptRow = {
  student: User;
  attempts: number;
  best_score: number | null;
  max_score: number;
  last_finished_at: string | null;
};

export type Lesson = {
  id: number;
  weekday: number;
  starts_at: string;
  ends_at: string;
  room: string | null;
  course: { id: number; name: string };
  group: GroupBrief;
};
