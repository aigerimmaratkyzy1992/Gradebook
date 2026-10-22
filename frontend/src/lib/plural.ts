export type PluralForms = readonly [one: string, few: string, many: string];

/** Орыс тіліндегі сөз түрлері: [1, 2–4, 5+]. */
export const PLURAL_FORMS = {
  assignment: ["задание", "задания", "заданий"],
  test: ["тест", "теста", "тестов"],
  student: ["студент", "студента", "студентов"],
  question: ["вопрос", "вопроса", "вопросов"],
  point: ["балл", "балла", "баллов"],
} as const satisfies Record<string, PluralForms>;

/** Орыс тіліндегі көпше түр: 1 задание, 2 задания, 5 заданий, 11 заданий. */
export function pluralize(count: number, [one, few, many]: PluralForms): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} ${few}`;
  return `${count} ${many}`;
}
