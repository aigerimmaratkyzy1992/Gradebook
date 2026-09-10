import { useEffect, useState } from "react";
import { Link } from "react-router";

import { Card, Empty } from "../components/Card";
import { Layout } from "../components/Layout";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../lib/api";
import { formatDate, isOverdue } from "../lib/date";
import { useSession } from "../lib/session";
import { ROLE_LABELS, type MyAssignment } from "../lib/types";

export default function Home() {
  const { user, logout } = useSession();
  const [assignments, setAssignments] = useState<MyAssignment[]>([]);

  const isStudent = user?.role === "student";

  useEffect(() => {
    if (!user) return;
    api<MyAssignment[]>("/api/my/assignments")
      .then(setAssignments)
      .catch(() => setAssignments([]));
  }, [user]);

  const pending = assignments.filter(
    (item) => item.status === null || item.status === "revision",
  );

  return (
    <Layout
      user={user}
      onLogout={logout}
      title={user ? `Привет, ${user.full_name ?? user.email}` : "GradeBook"}
      subtitle={
        user
          ? isStudent
            ? `${ROLE_LABELS[user.role]} · ${pending.length} заданий ждут сдачи`
            : `${ROLE_LABELS[user.role]} · ${assignments.length} заданий в ваших дисциплинах`
          : undefined
      }
    >
      <Card
        title={isStudent ? "Мои задания" : "Задания дисциплин"}
        flush
        action={
          <Link
            to="/courses"
            className="text-sm text-muted transition-colors duration-150 hover:text-ink"
          >
            Все дисциплины
          </Link>
        }
      >
        {assignments.length === 0 ? (
          <Empty>
            {isStudent
              ? "Вам пока не назначено ни одного задания"
              : "В ваших дисциплинах пока нет заданий"}
          </Empty>
        ) : (
          <ul className="divide-y divide-line">
            {assignments.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3.5 transition-colors duration-150 hover:bg-canvas"
              >
                <Link
                  to={`/assignments/${item.id}`}
                  className="w-64 truncate text-sm font-medium text-ink transition-colors duration-150 hover:text-muted"
                >
                  {item.title}
                </Link>
                <Link
                  to={`/courses/${item.course_id}`}
                  className="min-w-0 flex-1 truncate text-sm text-muted transition-colors duration-150 hover:text-ink"
                >
                  {item.course_name} · {item.topic_title}
                </Link>
                <span
                  className={`w-48 text-sm ${
                    isOverdue(item.due_at) && item.status === null
                      ? "text-red-600"
                      : "text-muted"
                  }`}
                >
                  {formatDate(item.due_at)}
                </span>
                {isStudent && (
                  <>
                    <span className="w-20 text-right text-sm font-medium text-ink">
                      {item.score === null ? "—" : `${item.score}/${item.max_score}`}
                    </span>
                    <span className="w-32 text-center">
                      <StatusBadge status={item.status} />
                    </span>
                  </>
                )}
                {!isStudent && (
                  <span className="w-24 text-right text-sm text-muted">
                    {item.max_score} б.
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Layout>
  );
}
