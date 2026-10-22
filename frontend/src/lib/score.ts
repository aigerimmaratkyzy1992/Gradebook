/** Мәннің максимумнан бүтін пайызы. Максимум жоқ (0) болса — 0, нөлге бөлмейміз. */
export function getPercent(value: number, max: number): number {
  return max > 0 ? Math.round((value / max) * 100) : 0;
}

/** «18/20» — балл мен максимумның бірыңғай жазылуы. */
export function formatScore(score: number, max: number): string {
  return `${score}/${max}`;
}
