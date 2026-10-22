import type { IUser, Role } from "@/types";

import { useApiResource } from "./useApiResource";

const NO_USERS: IUser[] = [];

/**
 * Бір рөлдегі пайдаланушылар (таңдау өрістері үшін). `?role=student` преподавательге
 * де ашық, басқа рөлдер — тек admin-ге, сондықтан `shouldFetch` false болса сұрау кетпейді.
 */
export function useUsersByRole(role: Role, shouldFetch: boolean): IUser[] {
  // Қатені әдейі елемейміз: тізім тек таңдау өрісіне керек, ол бос қалады,
  // ал ағымдағы мән (мыс. TeacherSelect-тің currentTeacher) бәрібір көрінеді.
  const { data } = useApiResource(shouldFetch ? `/api/users?role=${role}` : null, NO_USERS);
  return data;
}
