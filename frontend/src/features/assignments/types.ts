import type { IAssignment } from "@/types";

/** Тапсырма формасының өрістері — әрі POST/PATCH денесі, әрі өңдеудегі әдепкі мәндер. */
export type AssignmentPayload = Pick<
  IAssignment,
  "title" | "description" | "material_url" | "criteria" | "due_at" | "max_score"
>;
