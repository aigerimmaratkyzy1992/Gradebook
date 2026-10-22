import type { QuestionKind } from "@/types";

export const QUESTION_KINDS: readonly QuestionKind[] = [
  "single",
  "multiple",
  "true_false",
  "match",
  "short",
];

/** Бір сұрақтағы нұсқа ұяшықтары — бос қалғандары жіберілмейді. */
export const OPTION_SLOTS = [0, 1, 2, 3] as const;

/** Сервер «Правда / Ложь» сұрағын осы екі мәтінмен сақтайды. */
export const TRUE_LABEL = "Правда";
export const FALSE_LABEL = "Ложь";

/** Соңғы минутта таймер ескерту түсіне ауысады. */
export const TIMER_WARNING_SECONDS = 60;
