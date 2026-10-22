import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { NO_TEACHER_LABEL } from "@/constants/labels";
import type { IUser } from "@/types";

type NamedUser = Pick<IUser, "full_name" | "email">;

/** Tailwind кластарын біріктіреді: қайшы кластардың соңғысы жеңеді. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

/** Аватар үшін бір әріп: ФИО болмаса — поштадан. */
export function getInitials(name: string | null, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/[\s.@_-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

/** Пайдаланушының көрсетілетін аты: ФИО толтырылмаса — поштасы. */
export function getDisplayName(user: NamedUser): string {
  return user.full_name ?? user.email;
}

/** «Преподаватель: …» жолы — топ пен дисциплина тақырыптарында. */
export function getTeacherLabel(teacher: NamedUser | null): string {
  return teacher ? `Преподаватель: ${getDisplayName(teacher)}` : NO_TEACHER_LABEL;
}
