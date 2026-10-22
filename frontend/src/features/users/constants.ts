import type { BadgeVariant } from "@/components/ui/Badge";
import type { Role } from "@/types";

export const ROLE_OPTIONS = ["student", "teacher", "admin"] as const satisfies readonly Role[];

export const ROLE_BADGE_VARIANTS: Record<Role, BadgeVariant> = {
  admin: "default",
  teacher: "secondary",
  student: "outline",
};
