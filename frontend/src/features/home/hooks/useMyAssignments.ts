import { useApiResource } from "@/hooks/useApiResource";
import type { IMyAssignment } from "@/types";

const NO_ASSIGNMENTS: IMyAssignment[] = [];

/** Пайдаланушыға қолжетімді тапсырмалар (студентке — өз күйімен бірге). */
export function useMyAssignments() {
  return useApiResource("/api/my/assignments", NO_ASSIGNMENTS);
}
