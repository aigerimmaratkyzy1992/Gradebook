/** ISO → `datetime-local` өрісінің мәні (жергілікті уақытпен). */
export function toLocalInput(iso: string | null): string {
  if (!iso) return "";

  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

/** `datetime-local` мәні → ISO. */
export function fromLocalInput(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "Без срока";

  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Мерзімі өтіп кеткен бе. */
export function isOverdue(iso: string | null): boolean {
  return Boolean(iso) && new Date(iso as string).getTime() < Date.now();
}
