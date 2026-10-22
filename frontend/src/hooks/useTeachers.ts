import type { IUser } from "@/types";

import { useUsersByRole } from "./useUsersByRole";

/** Преподавательдер тізімі (таңдау өрісі үшін). Сұрау тек admin-ге рұқсат. */
export function useTeachers(shouldFetch: boolean): IUser[] {
  return useUsersByRole("teacher", shouldFetch);
}
