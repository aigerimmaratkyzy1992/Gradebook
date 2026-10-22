import { fromLocalInput } from "@/lib/date";
import { readFormText, readOptionalFormText } from "@/lib/form";

import { FALLBACK_MAX_SCORE } from "./constants";
import type { AssignmentPayload } from "./types";

/** Тапсырма формасы (құру мен өңдеуде бірдей) → API күтетін JSON. */
export function getAssignmentPayload(data: FormData): AssignmentPayload {
  return {
    title: readFormText(data, "title"),
    description: readOptionalFormText(data, "description"),
    material_url: readOptionalFormText(data, "material_url"),
    criteria: readOptionalFormText(data, "criteria"),
    due_at: fromLocalInput(readFormText(data, "due_at")),
    max_score: Number(data.get("max_score")) || FALLBACK_MAX_SCORE,
  };
}
