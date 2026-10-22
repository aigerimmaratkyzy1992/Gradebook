/** FormData өрісінің мәтіні. Өріс жоқ немесе файл болмаса — бос жол. */
export function readFormText(data: FormData, name: string): string {
  return String(data.get(name) ?? "");
}

/** Міндетті емес мәтін өрісі: бос не тек бос орындар болса — `null` (API солай күтеді). */
export function readOptionalFormText(data: FormData, name: string): string | null {
  return readFormText(data, name).trim() || null;
}

/** Таңдау өрісінің id-і: бос жол — «таңдалмаған» (`null`). */
export function parseOptionalId(value: string): number | null {
  return value ? Number(value) : null;
}
