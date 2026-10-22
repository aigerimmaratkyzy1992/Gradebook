import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { api, getErrorMessage } from "@/lib/api";
import type { IAttemptResult, ITestTake } from "@/types";

import type { AnswerMap, IAnswer } from "../types";

import { useCountdown } from "./useCountdown";

/** Студенттің тест өту циклі: тарих → бастау → жауаптар → аяқтау. */
export function useTestAttempt(testId: string | undefined) {
  const [history, setHistory] = useState<IAttemptResult[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [take, setTake] = useState<ITestTake | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [result, setResult] = useState<IAttemptResult | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  // Таймер мен түйме бір мезетте жіберіп қоймауы үшін — state емес, ref.
  const isSubmittedRef = useRef(false);

  const secondsLeft = useCountdown(take?.deadline ?? null);

  useEffect(() => {
    api<IAttemptResult[]>(`/api/tests/${testId}/my-attempts`)
      .then((items) => setHistory(items.filter((item) => item.finished_at)))
      .catch(() => setHistory([]))
      .finally(() => setIsHistoryLoading(false));
  }, [testId]);

  const finish = useCallback(async () => {
    if (!take || isSubmittedRef.current) return;
    isSubmittedRef.current = true;

    setIsFinishing(true);
    try {
      const payload = take.questions.map((question) => ({
        question_id: question.id,
        option_id: answers[question.id]?.option_id ?? null,
        option_ids: answers[question.id]?.option_ids ?? [],
        text: answers[question.id]?.text ?? null,
        pairs: answers[question.id]?.pairs ?? {},
      }));
      const finished = await api<IAttemptResult>(`/api/attempts/${take.attempt_id}/finish`, {
        method: "POST",
        body: JSON.stringify({ answers: payload }),
      });
      setResult(finished);
      setHistory((current) => [...current, finished]);
      setTake(null);
    } catch (caught) {
      toast.error(getErrorMessage(caught));
      isSubmittedRef.current = false;
    } finally {
      setIsFinishing(false);
    }
  }, [take, answers]);

  // Уақыт біткенде жауаптар автоматты жіберіледі.
  useEffect(() => {
    if (secondsLeft === 0 && take) void finish();
  }, [secondsLeft, take, finish]);

  async function start() {
    setIsStarting(true);
    try {
      const started = await api<ITestTake>(`/api/tests/${testId}/start`, { method: "POST" });
      isSubmittedRef.current = false;
      setResult(null);
      setAnswers({});
      setTake(started);
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setIsStarting(false);
    }
  }

  function updateAnswer(questionId: number, patch: IAnswer) {
    setAnswers((current) => ({
      ...current,
      [questionId]: { ...current[questionId], ...patch },
    }));
  }

  return {
    history,
    isHistoryLoading,
    take,
    answers,
    result,
    secondsLeft,
    isStarting,
    isFinishing,
    start,
    finish,
    updateAnswer,
  };
}
