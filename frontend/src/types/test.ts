import type { IUser } from "./user";

export type QuestionKind = "single" | "multiple" | "true_false" | "match" | "short";

export interface ITestBrief {
  id: number;
  topic_id: number;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  attempts_allowed: number;
  due_at: string | null;
}

export interface IOption {
  id: number;
  text: string;
  is_correct: boolean;
  match_text: string | null;
}

export interface IQuestion {
  id: number;
  kind: QuestionKind;
  text: string;
  position: number;
  points: number;
  options: IOption[];
}

export type TestFull = ITestBrief & {
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_result: boolean;
  questions: IQuestion[];
  max_score: number;
};

/** Студентке көрсетілетін сұрақ — дұрыс жауаптарсыз. */
export interface ITakeQuestion extends Pick<IQuestion, "id" | "kind" | "text" | "points"> {
  options: Pick<IOption, "id" | "text">[];
  match_targets: string[];
}

export interface ITestTake
  extends Pick<ITestBrief, "id" | "title" | "description">,
    Pick<TestFull, "show_result" | "max_score"> {
  attempt_id: number;
  deadline: string | null;
  questions: ITakeQuestion[];
}

export interface IAttemptResult {
  id: number;
  score: number;
  max_score: number;
  finished_at: string | null;
  show_result: boolean;
}

export interface IAttemptRow {
  student: IUser;
  attempts: number;
  best_score: number | null;
  max_score: number;
  last_finished_at: string | null;
}

/** Тест параметрлері: `PATCH /api/tests/{id}` денесі әрі баптаулар формасының мәндері. */
export type TestSettings = Pick<
  TestFull,
  | "title"
  | "description"
  | "time_limit_minutes"
  | "attempts_allowed"
  | "due_at"
  | "shuffle_questions"
  | "shuffle_options"
  | "show_result"
>;

/** Сұрақ нұсқасы сұраныста: id-сіз, `match_text` тек «Соответствие» үшін. */
export type OptionPayload = Pick<IOption, "text" | "is_correct"> &
  Partial<Pick<IOption, "match_text">>;

/** `POST /api/tests/{id}/questions` және `PATCH /api/questions/{id}` денесі. */
export type QuestionPayload = Pick<IQuestion, "kind" | "text" | "points"> & {
  options: OptionPayload[];
};
