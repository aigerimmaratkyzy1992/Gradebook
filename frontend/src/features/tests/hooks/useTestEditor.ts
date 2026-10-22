import { useCallback, useEffect, useState } from "react";

import { api, getErrorMessage } from "@/lib/api";
import type { IAttemptRow, TestFull } from "@/types";

import type { IQuestionPayload, ITestSettingsPayload } from "../types";

/** Тест редакторының деректері мен мутациялары. Қате шақырушыға лақтырылады. */
export function useTestEditor(testId: string | undefined) {
  const [test, setTest] = useState<TestFull | null>(null);
  const [attempts, setAttempts] = useState<IAttemptRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setTest(await api<TestFull>(`/api/tests/${testId}`));
      // Нәтижелер кестесі қосымша — ол құласа да редактор ашылады.
      setAttempts(
        await api<IAttemptRow[]>(`/api/tests/${testId}/attempts`).catch(() => []),
      );
    } catch (caught) {
      setLoadError(getErrorMessage(caught));
    } finally {
      setIsLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveSettings(payload: ITestSettingsPayload) {
    setTest(
      await api<TestFull>(`/api/tests/${testId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    );
  }

  async function addQuestion(payload: IQuestionPayload) {
    setTest(
      await api<TestFull>(`/api/tests/${testId}/questions`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
  }

  async function updateQuestion(questionId: number, payload: IQuestionPayload) {
    // PATCH түрін өзгертпейді — тек мәтін, балл және нұсқалар.
    const { text, points, options } = payload;
    setTest(
      await api<TestFull>(`/api/questions/${questionId}`, {
        method: "PATCH",
        body: JSON.stringify({ text, points, options }),
      }),
    );
  }

  async function deleteQuestion(questionId: number) {
    setTest(await api<TestFull>(`/api/questions/${questionId}`, { method: "DELETE" }));
  }

  async function deleteTest() {
    await api(`/api/tests/${testId}`, { method: "DELETE" });
  }

  return {
    test,
    attempts,
    isLoading,
    loadError,
    saveSettings,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    deleteTest,
  };
}
