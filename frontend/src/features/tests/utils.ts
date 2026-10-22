import { fromLocalInput } from "@/lib/date";
import type { IOption, ITakeQuestion, QuestionKind } from "@/types";

import { FALSE_LABEL, OPTION_SLOTS, TRUE_LABEL } from "./constants";
import type { AnswerMap, IOptionPayload, IQuestionPayload, ITestSettingsPayload } from "./types";

function readText(data: FormData, key: string): string {
  return String(data.get(key) ?? "").trim();
}

/** Нұсқалар толық ауыстырылады — түріне қарай пішіні әртүрлі. */
function buildOptions(kind: QuestionKind, data: FormData): IOptionPayload[] {
  if (kind === "short") {
    return [{ text: String(data.get("answer") ?? ""), is_correct: true }];
  }

  if (kind === "true_false") {
    return [
      { text: TRUE_LABEL, is_correct: data.get("tf") === "true" },
      { text: FALSE_LABEL, is_correct: data.get("tf") === "false" },
    ];
  }

  return OPTION_SLOTS.map((slot) => ({
    text: readText(data, `option_${slot}`),
    // «Один правильный» — радио (бір ғана мән), қалғаны — чекбокстар.
    is_correct:
      kind === "single"
        ? data.get("correct") === String(slot)
        : data.get(`correct_${slot}`) === "on",
    match_text: readText(data, `match_${slot}`) || null,
  })).filter((option) => option.text);
}

export function buildQuestionPayload(kind: QuestionKind, data: FormData): IQuestionPayload {
  return {
    kind,
    text: String(data.get("text") ?? ""),
    points: Number(data.get("points")) || 1,
    options: buildOptions(kind, data),
  };
}

export function buildSettingsPayload(data: FormData): ITestSettingsPayload {
  const timeLimit = data.get("time_limit_minutes");

  return {
    title: String(data.get("title") ?? ""),
    description: readText(data, "description") || null,
    time_limit_minutes: timeLimit ? Number(timeLimit) : null,
    attempts_allowed: Number(data.get("attempts_allowed")) || 1,
    due_at: fromLocalInput(String(data.get("due_at") ?? "")),
    shuffle_questions: data.get("shuffle_questions") === "on",
    shuffle_options: data.get("shuffle_options") === "on",
    show_result: data.get("show_result") === "on",
  };
}

export function getIsTrueCorrect(options: Pick<IOption, "text" | "is_correct">[]): boolean {
  return options.find((option) => option.is_correct)?.text !== FALSE_LABEL;
}

/** Секундтарды «м:сс» пішініне келтіреді. */
export function formatTimer(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Жауап берілген сұрақтар саны — таймер жолағындағы прогресс үшін. */
export function countAnswered(questions: ITakeQuestion[], answers: AnswerMap): number {
  return questions.filter((question) => {
    const answer = answers[question.id];
    if (!answer) return false;
    if (question.kind === "multiple") return (answer.option_ids?.length ?? 0) > 0;
    if (question.kind === "short") return Boolean(answer.text?.trim());
    if (question.kind === "match") return Object.values(answer.pairs ?? {}).some(Boolean);
    return answer.option_id != null;
  }).length;
}

export function getPercent(score: number, maxScore: number): number {
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}
