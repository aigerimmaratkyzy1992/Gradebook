import type { QuestionKind } from "@/types";

export interface IOptionPayload {
  text: string;
  is_correct: boolean;
  match_text?: string | null;
}

/** `POST /api/tests/{id}/questions` және `PATCH /api/questions/{id}` денесі. */
export interface IQuestionPayload {
  kind: QuestionKind;
  text: string;
  points: number;
  options: IOptionPayload[];
}

export interface ITestSettingsPayload {
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  attempts_allowed: number;
  due_at: string | null;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_result: boolean;
}

/** Студенттің бір сұраққа берген жауабы — түріне қарай бір өрісі толады. */
export interface IAnswer {
  option_id?: number | null;
  option_ids?: number[];
  text?: string;
  pairs?: Record<string, string>;
}

export type AnswerMap = Record<number, IAnswer>;
