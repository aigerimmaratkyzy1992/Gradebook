import {
  CalendarDays,
  House,
  LibraryBig,
  ShieldUser,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import type { Role } from "@/types";

import { ROUTES } from "./routes";

export interface INavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Берілмесе — барлық рөлге көрінеді. */
  roles?: readonly Role[];
  isEnd?: boolean;
}

export const NAV_ITEMS: readonly INavItem[] = [
  { to: ROUTES.home, label: "Главная", icon: House, isEnd: true },
  { to: ROUTES.courses, label: "Дисциплины", icon: LibraryBig },
  { to: ROUTES.schedule, label: "Расписание", icon: CalendarDays },
  { to: ROUTES.groups, label: "Группы", icon: UsersRound, roles: ["admin", "teacher"] },
  { to: ROUTES.users, label: "Пользователи", icon: ShieldUser, roles: ["admin"] },
];
