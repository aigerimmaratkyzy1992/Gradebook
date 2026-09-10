import type { ReactNode } from "react";
import { Link, NavLink } from "react-router";

import { NotificationsMenu } from "./NotificationsMenu";
import { ProfileMenu } from "./ProfileMenu";
import type { User } from "../lib/types";

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-150",
    isActive ? "bg-ink text-white" : "text-muted hover:bg-canvas hover:text-ink",
  ].join(" ");

type Props = {
  user: User | null;
  onLogout: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function Layout({ user, onLogout, title, subtitle, children }: Props) {
  const isStaff = user?.role === "admin" || user?.role === "teacher";

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-10 border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5">
          <Link to="/" className="shrink-0 text-lg font-bold text-ink">
            GradeBook
          </Link>

          <nav className="flex min-w-0 items-center gap-1">
            <NavLink to="/" end className={navItemClass}>
              Главная
            </NavLink>
            <NavLink to="/courses" className={navItemClass}>
              Дисциплины
            </NavLink>
            <NavLink to="/schedule" className={navItemClass}>
              Расписание
            </NavLink>
            {isStaff && (
              <NavLink to="/groups" className={navItemClass}>
                Группы
              </NavLink>
            )}
            {user?.role === "admin" && (
              <NavLink to="/users" className={navItemClass}>
                Пользователи
              </NavLink>
            )}
            <span className="ml-2 flex items-center gap-2">
              <NotificationsMenu enabled={Boolean(user)} />
              <ProfileMenu user={user} onLogout={onLogout} />
            </span>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="mb-6 min-w-0">
          <h1 className="truncate text-2xl font-bold text-ink">{title}</h1>
          {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
        </div>

        <div className="space-y-5">{children}</div>
      </div>
    </div>
  );
}
