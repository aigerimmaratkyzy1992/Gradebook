import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { Button } from "../components/Button";
import { Card, Empty } from "../components/Card";
import { ErrorText } from "../components/ErrorText";
import { Input } from "../components/Input";
import { Layout } from "../components/Layout";
import { Select } from "../components/Select";
import { Textarea } from "../components/Textarea";
import { api } from "../lib/api";
import { formatDate, fromLocalInput, toLocalInput } from "../lib/date";
import { useSession } from "../lib/session";
import {
  KIND_LABELS,
  type AttemptRow,
  type QuestionKind,
  type TestFull,
} from "../lib/types";

const KINDS = Object.keys(KIND_LABELS) as QuestionKind[];
const OPTION_SLOTS = [0, 1, 2, 3];

export default function TestEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useSession();
  const [test, setTest] = useState<TestFull | null>(null);
  const [rows, setRows] = useState<AttemptRow[]>([]);
  const [kind, setKind] = useState<QuestionKind>("single");
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setTest(await api<TestFull>(`/api/tests/${id}`));
      setRows(await api<AttemptRow[]>(`/api/tests/${id}/attempts`).catch(() => []));
    } catch (caught) {
      setError((caught as Error).message);
    }
  }, [id]);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  async function handleSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setError("");
    try {
      setTest(
        await api<TestFull>(`/api/tests/${id}`, {
          method: "PATCH",
          body: JSON.stringify({
            title: data.get("title"),
            description: data.get("description") || null,
            time_limit_minutes: data.get("time_limit_minutes")
              ? Number(data.get("time_limit_minutes"))
              : null,
            attempts_allowed: Number(data.get("attempts_allowed")) || 1,
            due_at: fromLocalInput(String(data.get("due_at") ?? "")),
            shuffle_questions: data.get("shuffle_questions") === "on",
            shuffle_options: data.get("shuffle_options") === "on",
            show_result: data.get("show_result") === "on",
          }),
        }),
      );
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  async function handleAddQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const options =
      kind === "short"
        ? [{ text: String(data.get("answer") ?? ""), is_correct: true }]
        : kind === "true_false"
          ? [
              { text: "Правда", is_correct: data.get("tf") === "true" },
              { text: "Ложь", is_correct: data.get("tf") === "false" },
            ]
          : OPTION_SLOTS.map((slot) => ({
              text: String(data.get(`option_${slot}`) ?? "").trim(),
              is_correct: data.get(`correct_${slot}`) === "on",
              match_text: String(data.get(`match_${slot}`) ?? "").trim() || null,
            })).filter((option) => option.text);

    setError("");
    try {
      setTest(
        await api<TestFull>(`/api/tests/${id}/questions`, {
          method: "POST",
          body: JSON.stringify({
            kind,
            text: data.get("text"),
            points: Number(data.get("points")) || 1,
            options,
          }),
        }),
      );
      form.reset();
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  async function handleUpdateQuestion(
    event: FormEvent<HTMLFormElement>,
    questionId: number,
    questionKind: QuestionKind,
  ) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    // Нұсқалар толық ауыстырылады — түріне қарай пішіні әртүрлі.
    const options =
      questionKind === "short"
        ? [{ text: String(data.get("answer") ?? ""), is_correct: true }]
        : questionKind === "true_false"
          ? [
              { text: "Правда", is_correct: data.get("tf") === "true" },
              { text: "Ложь", is_correct: data.get("tf") === "false" },
            ]
          : OPTION_SLOTS.map((slot) => ({
              text: String(data.get(`option_${slot}`) ?? "").trim(),
              is_correct: data.get(`correct_${slot}`) === "on",
              match_text: String(data.get(`match_${slot}`) ?? "").trim() || null,
            })).filter((option) => option.text);

    setError("");
    try {
      setTest(
        await api<TestFull>(`/api/questions/${questionId}`, {
          method: "PATCH",
          body: JSON.stringify({
            text: data.get("text"),
            points: Number(data.get("points")) || 1,
            options,
          }),
        }),
      );
      setEditing(null);
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  async function handleDeleteQuestion(questionId: number) {
    if (!confirm("Удалить вопрос?")) return;

    try {
      setTest(await api<TestFull>(`/api/questions/${questionId}`, { method: "DELETE" }));
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  async function handleDeleteTest() {
    if (!test || !confirm(`Удалить тест «${test.title}»?`)) return;

    try {
      await api(`/api/tests/${id}`, { method: "DELETE" });
      navigate("/courses", { replace: true });
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  return (
    <Layout
      user={user}
      onLogout={logout}
      title={test?.title ?? "Тест"}
      subtitle={
        test
          ? `${test.questions.length} вопросов · ${test.max_score} баллов · ${
              test.time_limit_minutes ? `${test.time_limit_minutes} мин` : "без таймера"
            } · попыток: ${test.attempts_allowed}`
          : undefined
      }
    >
      <Link
        to="/courses"
        className="inline-block text-sm text-muted transition-colors duration-150 hover:text-ink"
      >
        ← Дисциплины
      </Link>

      {error && <ErrorText>{error}</ErrorText>}

      {test && (
        <>
          <Card title="Настройки теста">
            <form onSubmit={handleSettings} className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="text"
                  name="title"
                  defaultValue={test.title}
                  placeholder="Название"
                  className="w-72"
                  required
                />
                <Input
                  type="number"
                  name="time_limit_minutes"
                  defaultValue={test.time_limit_minutes ?? ""}
                  min={1}
                  max={600}
                  placeholder="Минут"
                  className="w-28"
                  title="Ограничение времени"
                />
                <Input
                  type="number"
                  name="attempts_allowed"
                  defaultValue={test.attempts_allowed}
                  min={1}
                  max={20}
                  className="w-24"
                  title="Количество попыток"
                />
                <Input
                  type="datetime-local"
                  name="due_at"
                  defaultValue={toLocalInput(test.due_at)}
                  className="w-56"
                  title="Срок сдачи"
                />
              </div>

              <Textarea
                name="description"
                defaultValue={test.description ?? ""}
                placeholder="Описание теста"
                rows={2}
                className="w-full"
              />

              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    name="shuffle_questions"
                    defaultChecked={test.shuffle_questions}
                    className="size-4 accent-ink"
                  />
                  Случайный порядок вопросов
                </label>
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    name="shuffle_options"
                    defaultChecked={test.shuffle_options}
                    className="size-4 accent-ink"
                  />
                  Случайный порядок вариантов
                </label>
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    name="show_result"
                    defaultChecked={test.show_result}
                    className="size-4 accent-ink"
                  />
                  Показывать результат сразу
                </label>
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit">Сохранить</Button>
                <button
                  type="button"
                  onClick={() => void handleDeleteTest()}
                  className="ml-auto text-sm text-muted transition-colors duration-150 hover:text-red-600"
                >
                  Удалить тест
                </button>
              </div>
            </form>
          </Card>

          <Card title="Новый вопрос">
            <form onSubmit={handleAddQuestion} className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={kind}
                  onChange={(event) => setKind(event.target.value as QuestionKind)}
                >
                  {KINDS.map((item) => (
                    <option key={item} value={item}>
                      {KIND_LABELS[item]}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  name="points"
                  defaultValue={1}
                  min={1}
                  max={100}
                  className="w-24"
                  title="Баллы"
                />
              </div>

              <Textarea
                name="text"
                placeholder="Текст вопроса"
                rows={2}
                className="w-full"
                required
              />

              {kind === "short" && (
                <Input
                  type="text"
                  name="answer"
                  placeholder="Правильный ответ"
                  className="w-72"
                  required
                />
              )}

              {kind === "true_false" && (
                <Select name="tf" defaultValue="true">
                  <option value="true">Правильно: Правда</option>
                  <option value="false">Правильно: Ложь</option>
                </Select>
              )}

              {(kind === "single" || kind === "multiple") && (
                <div className="space-y-2">
                  {OPTION_SLOTS.map((slot) => (
                    <div key={slot} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name={`correct_${slot}`}
                        className="size-4 accent-ink"
                        title="Правильный вариант"
                      />
                      <Input
                        type="text"
                        name={`option_${slot}`}
                        placeholder={`Вариант ${slot + 1}`}
                        className="w-80"
                      />
                    </div>
                  ))}
                </div>
              )}

              {kind === "match" && (
                <div className="space-y-2">
                  {OPTION_SLOTS.map((slot) => (
                    <div key={slot} className="flex flex-wrap items-center gap-2">
                      <Input
                        type="text"
                        name={`option_${slot}`}
                        placeholder={`Слева ${slot + 1}`}
                        className="w-60"
                      />
                      <span className="text-muted">→</span>
                      <Input
                        type="text"
                        name={`match_${slot}`}
                        placeholder={`Справа ${slot + 1}`}
                        className="w-60"
                      />
                    </div>
                  ))}
                </div>
              )}

              <Button type="submit">Добавить вопрос</Button>
            </form>
          </Card>

          <Card title={`Вопросы · ${test.questions.length}`} flush>
            {test.questions.length === 0 ? (
              <Empty>В тесте пока нет вопросов</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {test.questions.map((question, index) =>
                  editing === question.id ? (
                  <li key={question.id} className="px-5 py-3.5">
                    <form
                      onSubmit={(event) =>
                        void handleUpdateQuestion(event, question.id, question.kind)
                      }
                      className="space-y-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted">
                          {KIND_LABELS[question.kind]}
                        </span>
                        <Input
                          type="number"
                          name="points"
                          defaultValue={question.points}
                          min={1}
                          max={100}
                          className="w-24"
                          title="Баллы"
                        />
                      </div>

                      <Textarea
                        name="text"
                        defaultValue={question.text}
                        placeholder="Текст вопроса"
                        rows={2}
                        className="w-full"
                        required
                      />

                      {question.kind === "short" && (
                        <Input
                          type="text"
                          name="answer"
                          defaultValue={question.options[0]?.text ?? ""}
                          placeholder="Правильный ответ"
                          className="w-72"
                          required
                        />
                      )}

                      {question.kind === "true_false" && (
                        <Select
                          name="tf"
                          defaultValue={
                            question.options.find((option) => option.is_correct)
                              ?.text === "Ложь"
                              ? "false"
                              : "true"
                          }
                        >
                          <option value="true">Правильно: Правда</option>
                          <option value="false">Правильно: Ложь</option>
                        </Select>
                      )}

                      {(question.kind === "single" ||
                        question.kind === "multiple") && (
                        <div className="space-y-2">
                          {OPTION_SLOTS.map((slot) => (
                            <div key={slot} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                name={`correct_${slot}`}
                                defaultChecked={question.options[slot]?.is_correct}
                                className="size-4 accent-ink"
                                title="Правильный вариант"
                              />
                              <Input
                                type="text"
                                name={`option_${slot}`}
                                defaultValue={question.options[slot]?.text ?? ""}
                                placeholder={`Вариант ${slot + 1}`}
                                className="w-80"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {question.kind === "match" && (
                        <div className="space-y-2">
                          {OPTION_SLOTS.map((slot) => (
                            <div
                              key={slot}
                              className="flex flex-wrap items-center gap-2"
                            >
                              <Input
                                type="text"
                                name={`option_${slot}`}
                                defaultValue={question.options[slot]?.text ?? ""}
                                placeholder={`Слева ${slot + 1}`}
                                className="w-60"
                              />
                              <span className="text-muted">→</span>
                              <Input
                                type="text"
                                name={`match_${slot}`}
                                defaultValue={
                                  question.options[slot]?.match_text ?? ""
                                }
                                placeholder={`Справа ${slot + 1}`}
                                className="w-60"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <Button type="submit">Сохранить</Button>
                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          className="text-sm text-muted transition-colors duration-150 hover:text-ink"
                        >
                          Отмена
                        </button>
                      </div>
                    </form>
                  </li>
                  ) : (
                  <li key={question.id} className="space-y-2 px-5 py-3.5">
                    <div className="flex items-start gap-3">
                      <span className="flex-1 text-sm font-medium text-ink">
                        {index + 1}. {question.text}
                      </span>
                      <span className="text-sm text-muted">
                        {KIND_LABELS[question.kind]} · {question.points} б.
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditing(question.id)}
                        className="text-sm text-muted transition-colors duration-150 hover:text-ink"
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteQuestion(question.id)}
                        className="text-sm text-muted transition-colors duration-150 hover:text-red-600"
                      >
                        Удалить
                      </button>
                    </div>
                    <ul className="space-y-1 pl-4">
                      {question.options.map((option) => (
                        <li
                          key={option.id}
                          className={`text-sm ${
                            option.is_correct ? "font-medium text-ink" : "text-muted"
                          }`}
                        >
                          {option.match_text
                            ? `${option.text} → ${option.match_text}`
                            : `${option.is_correct ? "✓ " : "· "}${option.text}`}
                        </li>
                      ))}
                    </ul>
                  </li>
                  ),
                )}
              </ul>
            )}
          </Card>

          <Card title={`Результаты · ${rows.filter((row) => row.attempts).length} из ${rows.length}`} flush>
            {rows.length === 0 ? (
              <Empty>В группах дисциплины пока нет студентов</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {rows.map((row) => (
                  <li
                    key={row.student.id}
                    className="flex items-center gap-3 px-5 py-3.5"
                  >
                    <span className="flex-1 truncate text-sm text-ink">
                      {row.student.full_name ?? row.student.email}
                    </span>
                    <span className="w-24 text-sm text-muted">
                      {row.attempts} попыт.
                    </span>
                    <span className="w-40 text-sm text-muted">
                      {row.last_finished_at ? formatDate(row.last_finished_at) : "—"}
                    </span>
                    <span className="w-20 text-right text-sm font-medium text-ink">
                      {row.best_score === null
                        ? "—"
                        : `${row.best_score}/${row.max_score}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </Layout>
  );
}
