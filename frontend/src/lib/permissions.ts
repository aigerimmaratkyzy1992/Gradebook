import type { Role } from "@/types";

/** Барлық рөлдік тексерістің бір көзі — беттерде `role === ...` жазбаймыз. */

export const STAFF_ROLES: readonly Role[] = ["admin", "teacher"];

export function getIsStaff(role: Role): boolean {
  return STAFF_ROLES.includes(role);
}

export function getIsAdmin(role: Role): boolean {
  return role === "admin";
}

export function getIsStudent(role: Role): boolean {
  return role === "student";
}

/** Преподавательді таңдау (топ/дисциплина үшін) тек admin-ге рұқсат. */
export function getCanAssignTeacher(role: Role): boolean {
  return getIsAdmin(role);
}
