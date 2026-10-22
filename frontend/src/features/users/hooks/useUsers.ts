import { useApiResource } from "@/hooks/useApiResource";
import type { IUser } from "@/types";

const NO_USERS: IUser[] = [];

/** Admin-ге арналған барлық пайдаланушылар тізімі. */
export function useUsers() {
  return useApiResource("/api/users", NO_USERS);
}
