import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";

import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ErrorText } from "../components/ErrorText";
import { Input } from "../components/Input";
import { Layout } from "../components/Layout";
import { Select } from "../components/Select";
import { api } from "../lib/api";
import { formatDate } from "../lib/date";
import { useSession } from "../lib/session";
import type { AttemptResult, TestTake as TestTakeType } from "../lib/types";

type Answer = {
  option_id?: number | null;
  option_ids?: number[];
  text?: string;
  pairs?: Record<string, string>;
};

function useCountdown(deadline: string | null) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline) return;

    const tick = () =>
      setLeft(Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  return left;
}

export default function TestTake() {
  const { id } = useParams();
  const { user, logout } = useSession();
  const [take, setTake] = useState<TestTakeType | null>(null);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [history, setHistory] = useState<AttemptResult[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submittedRef = useRef(false);

  const left = useCountdown(take?.deadline ?? null);

  useEffect(() => {
    if (!user) return;
    api<AttemptResult[]>(`/api/tests/${id}/my-attempts`)
      .then((items) => setHistory(items.filter((item) => item.finished_at)))
      .catch(() => setHistory([]));
  }, [user, id]);

  const finish = useCallback(async () => {
    if (!take || submittedRef.current) return;
    submittedRef.current = true;

    setLoading(true);
    try {
      const payload = take.questions.map((question) => ({
        question_id: question.id,
        option_id: answers[question.id]?.option_id ?? null,
        option_ids: answers[question.id]?.option_ids ?? [],
        text: answers[question.id]?.text ?? null,
        pairs: answers[question.id]?.pairs ?? {},
      }));
      setResult(
        await api<AttemptResult>(`/api/attempts/${take.attempt_id}/finish`, {
          method: "POST",
          body: JSON.stringify({ answers: payload }),
        }),
      );
      setTake(null);
    } catch (caught) {
      setError((caught as Error).message);
      submittedRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [take, answers]);

  // Уақыт біткенде жауаптар автоматты жіберіледі.
  useEffect(() => {
    if (left === 0 && take) void finish();
  }, [left, take, finish]);

  async function start() {
    setError("");
    try {
      submittedRef.current = false;
      setResult(null);
      setAnswers({});
      setTake(await api<TestTakeType>(`/api/tests/${id}/start`, { method: "POST" }));
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  function update(questionId: number, patch: Answer) {
    setAnswers((current) => ({
      ...current,
      [questionId]: { ...current[questionId], ...patch },
    }));
  }

  const minutes = left === null ? null : Math.floor(left / 60);
  const seconds = left === null ? null : left % 60;

  return (
    <Layout
      user={user}
      onLogout={logout}
      title={take?.title ?? "Тест"}
      subtitle={
        take
          ? `${take.questions.length} вопросов · ${take.max_score} баллов`
          : undefined
      }
    >
      <Link
        to="/"
        className="inline-block text-sm text-muted transition-colors duration-150 hover:text-ink"
      >
        ← Главная
      </Link>

      {error && <ErrorText>{error}</ErrorText>}

      {result && (
        <Card title="Результат">
          {result.show_result ? (
            <p className="text-2xl font-bold text-ink">
              {result.score} <span className="text-muted">из {result.max_score}</span>
            </p>
          ) : (
            <p className="text-sm text-muted">
              Работа принята. Результат покажет преподаватель.
            </p>
          )}
        </Card>
      )}

      {!take && (
        <Card title="Тест">
          <div className="space-y-4">
            {history.length > 0 && (
              <ul className="divide-y divide-line rounded-xl border border-line">
                {history.map((item, index) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm"
                  >
                    <span className="flex-1 text-muted">
                      Попытка {index + 1} · {formatDate(item.finished_at)}
                    </span>
                    <span className="font-medium text-ink">
                      {item.show_result ? `${item.score}/${item.max_score}` : "принято"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Button type="button" onClick={() => void start()}>
              {history.length > 0 ? "Пройти ещё раз" : "Начать тест"}
            </Button>
          </div>
        </Card>
      )}

      {take && (
        <>
          {left !== null && (
            <div
              className={`sticky top-16 z-10 rounded-2xl border bg-surface px-5 py-3 text-sm font-medium ${
                left < 60 ? "border-red-500 text-red-600" : "border-line text-ink"
              }`}
            >
              Осталось {minutes}:{String(seconds).padStart(2, "0")}
            </div>
          )}

          {take.questions.map((question, index) => (
            <Card key={question.id} title={`Вопрос ${index + 1} · ${question.points} б.`}>
              <div className="space-y-3">
                <p className="whitespace-pre-line text-sm text-ink">{question.text}</p>

                {(question.kind === "single" || question.kind === "true_false") && (
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center gap-2 text-sm text-ink"
                      >
                        <input
                          type="radio"
                          name={`q_${question.id}`}
                          className="size-4 accent-ink"
                          onChange={() => update(question.id, { option_id: option.id })}
                        />
                        {option.text}
                      </label>
                    ))}
                  </div>
                )}

                {question.kind === "multiple" && (
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center gap-2 text-sm text-ink"
                      >
                        <input
                          type="checkbox"
                          className="size-4 accent-ink"
                          onChange={(event) => {
                            const current = answers[question.id]?.option_ids ?? [];
                            update(question.id, {
                              option_ids: event.target.checked
                                ? [...current, option.id]
                                : current.filter((item) => item !== option.id),
                            });
                          }}
                        />
                        {option.text}
                      </label>
                    ))}
                  </div>
                )}

                {question.kind === "short" && (
                  <Input
                    type="text"
                    placeholder="Ваш ответ"
                    className="w-72"
                    onChange={(event) =>
                      update(question.id, { text: event.target.value })
                    }
                  />
                )}

                {question.kind === "match" && (
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <div key={option.id} className="flex flex-wrap items-center gap-2">
                        <span className="w-52 text-sm text-ink">{option.text}</span>
                        <span className="text-muted">→</span>
                        <Select
                          defaultValue=""
                          onChange={(event) =>
                            update(question.id, {
                              pairs: {
                                ...(answers[question.id]?.pairs ?? {}),
                                [option.id]: event.target.value,
                              },
                            })
                          }
                        >
                          <option value="">— выберите —</option>
                          {question.match_targets.map((target) => (
                            <option key={target} value={target}>
                              {target}
                            </option>
                          ))}
                        </Select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}

          <Button type="button" onClick={() => void finish()} disabled={loading}>
            {loading ? "Отправка…" : "Завершить тест"}
          </Button>
        </>
      )}
    </Layout>
  );
}
