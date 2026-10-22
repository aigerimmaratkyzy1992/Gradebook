import type { QuestionKind, Role, SubmissionStatus } from "@/types";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Администратор",
  teacher: "Преподаватель",
  student: "Студент",
};

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  submitted: "Сдано",
  reviewed: "Проверено",
  revision: "На доработку",
};

export const NOT_SUBMITTED_LABEL = "Не сдано";

export const NO_TEACHER_LABEL = "Преподаватель не назначен";

export const KIND_LABELS: Record<QuestionKind, string> = {
  single: "Один правильный",
  multiple: "Несколько правильных",
  true_false: "Правда / Ложь",
  match: "Соответствие",
  short: "Короткий ответ",
};
