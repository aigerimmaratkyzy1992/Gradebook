import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { Card, Empty } from "../components/Card";
import { ErrorText } from "../components/ErrorText";
import { Layout } from "../components/Layout";
import { api, download } from "../lib/api";
import { useSession } from "../lib/session";
import type { CourseDetail, CourseStats, GradebookData } from "../lib/types";

type Bar = { key: string; label: string; percent: number; caption: string };

/** Қарапайым көлденең диаграмма — қосымша кітапханасыз. */
function BarChart({ bars }: { bars: Bar[] }) {
  return (
    <ul className="space-y-2.5">
      {bars.map((bar) => (
        <li key={bar.key} className="flex items-center gap-3">
          <span className="w-40 shrink-0 truncate text-sm text-muted" title={bar.label}>
            {bar.label}
          </span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-canvas ring-1 ring-line ring-inset">
            <span
              className="block h-full rounded-full bg-ink"
              style={{ width: `${bar.percent}%` }}
            />
          </span>
          <span className="w-16 shrink-0 text-right text-sm font-medium text-ink">
            {bar.caption}
          </span>
        </li>
      ))}
    </ul>
  );
}

// Бағалар шкаласы — жоғарыдан төмен.
const BUCKETS = [
  { label: "90–100%", min: 90 },
  { label: "75–89%", min: 75 },
  { label: "60–74%", min: 60 },
  { label: "0–59%", min: 0 },
];

function buildCharts(book: GradebookData) {
  const byAssignment: Bar[] = book.columns.map((column, index) => {
    const scores = book.rows
      .map((row) => row.cells[index].score)
      .filter((score): score is number => score !== null);
    const percent = scores.length
      ? Math.round(
          (scores.reduce((sum, score) => sum + score, 0) /
            scores.length /
            column.max_score) *
            100,
        )
      : 0;
    return {
      key: String(column.id),
      label: column.title,
      percent,
      caption: `${percent}%`,
    };
  });

  const percents = book.rows.flatMap((row) =>
    row.cells
      .map((cell, index) =>
        cell.score === null
          ? null
          : (cell.score / book.columns[index].max_score) * 100,
      )
      .filter((value): value is number => value !== null),
  );

  const distribution: Bar[] = BUCKETS.map((bucket, index) => {
    const upper = index === 0 ? Infinity : BUCKETS[index - 1].min;
    const count = percents.filter(
      (value) => value >= bucket.min && value < upper,
    ).length;
    return {
      key: bucket.label,
      label: bucket.label,
      percent: percents.length ? (count / percents.length) * 100 : 0,
      caption: String(count),
    };
  });

  return { byAssignment, distribution, graded: percents.length };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line px-4 py-3">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-xl font-bold text-ink">{value}</p>
    </div>
  );
}

export default function Gradebook() {
  const { id } = useParams();
  const { user, logout } = useSession();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [book, setBook] = useState<GradebookData | null>(null);
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [courseData, bookData, statsData] = await Promise.all([
        api<CourseDetail>(`/api/courses/${id}`),
        api<GradebookData>(`/api/courses/${id}/gradebook`),
        api<CourseStats>(`/api/courses/${id}/stats`),
      ]);
      setCourse(courseData);
      setBook(bookData);
      setStats(statsData);
    } catch (caught) {
      setError((caught as Error).message);
    }
  }, [id]);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  const charts = book && book.columns.length > 0 ? buildCharts(book) : null;

  return (
    <Layout
      user={user}
      onLogout={logout}
      title="Журнал оценок"
      subtitle={course?.name}
    >
      <div className="flex flex-wrap items-center gap-4">
        <Link
          to={`/courses/${id}`}
          className="text-sm text-muted transition-colors duration-150 hover:text-ink"
        >
          ← {course?.name ?? "Дисциплина"}
        </Link>
        <button
          type="button"
          onClick={() =>
            void download(
              `/api/courses/${id}/gradebook.xlsx`,
              `Журнал — ${course?.name ?? "дисциплина"}.xlsx`,
            )
          }
          className="ml-auto rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors duration-150 hover:border-ink"
        >
          Скачать Excel
        </button>
      </div>

      {error && <ErrorText>{error}</ErrorText>}

      {stats && (
        <Card title="Статистика">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Студентов" value={String(stats.students)} />
            <Stat
              label="Сдано работ"
              value={`${stats.submitted} из ${stats.expected}`}
            />
            <Stat
              label="Средний балл"
              value={stats.average === null ? "—" : String(stats.average)}
            />
            <Stat label="Успеваемость" value={`${stats.completion_percent}%`} />
          </div>

          {stats.hardest.length > 0 && (
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-sm text-muted">Самые сложные задания</p>
                <ul className="divide-y divide-line rounded-xl border border-line">
                  {stats.hardest.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <Link
                        to={`/assignments/${item.id}`}
                        className="flex-1 truncate text-sm text-ink transition-colors duration-150 hover:text-muted"
                      >
                        {item.title}
                      </Link>
                      <span className="text-sm font-medium text-ink">
                        {item.average_percent}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-2 text-sm text-muted">Рейтинг студентов</p>
                <ul className="divide-y divide-line rounded-xl border border-line">
                  {stats.ranking.slice(0, 5).map((entry, index) => (
                    <li
                      key={entry.student.id}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <span className="w-5 text-sm text-muted">{index + 1}</span>
                      <span className="flex-1 truncate text-sm text-ink">
                        {entry.student.full_name ?? entry.student.email}
                      </span>
                      <span className="text-sm font-medium text-ink">
                        {entry.average}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Card>
      )}

      {charts && charts.graded > 0 && (
        <Card title="Графики">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-sm text-muted">Средний балл по заданиям</p>
              <BarChart bars={charts.byAssignment} />
            </div>
            <div>
              <p className="mb-3 text-sm text-muted">
                Распределение оценок · {charts.graded} работ
              </p>
              <BarChart bars={charts.distribution} />
            </div>
          </div>
        </Card>
      )}

      {book && (
        <Card title={`Оценки · ${book.rows.length} студентов`} flush>
          {book.rows.length === 0 || book.columns.length === 0 ? (
            <Empty>
              {book.columns.length === 0
                ? "В дисциплине пока нет заданий"
                : "В группах дисциплины пока нет студентов"}
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="sticky left-0 bg-surface px-5 py-3 font-medium text-muted">
                      Студент
                    </th>
                    {book.columns.map((column) => (
                      <th
                        key={column.id}
                        className="min-w-28 px-3 py-3 text-center font-medium text-muted"
                      >
                        <Link
                          to={`/assignments/${column.id}`}
                          className="block truncate transition-colors duration-150 hover:text-ink"
                          title={`${column.topic_title} · ${column.title}`}
                        >
                          {column.title}
                        </Link>
                        <span className="text-xs">из {column.max_score}</span>
                      </th>
                    ))}
                    <th className="px-5 py-3 text-right font-medium text-muted">
                      Средний
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {book.rows.map((row) => (
                    <tr
                      key={row.student.id}
                      className="border-b border-line last:border-0 transition-colors duration-150 hover:bg-canvas"
                    >
                      <td className="sticky left-0 bg-surface px-5 py-3 font-medium text-ink">
                        {row.student.full_name ?? row.student.email}
                      </td>
                      {row.cells.map((cell) => (
                        <td
                          key={cell.assignment_id}
                          className={`px-3 py-3 text-center ${
                            cell.status === "revision"
                              ? "text-red-600"
                              : cell.score === null
                                ? "text-muted"
                                : "text-ink"
                          }`}
                        >
                          {cell.score ?? (cell.status ? "•" : "—")}
                        </td>
                      ))}
                      <td className="px-5 py-3 text-right font-bold text-ink">
                        {row.average ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </Layout>
  );
}
