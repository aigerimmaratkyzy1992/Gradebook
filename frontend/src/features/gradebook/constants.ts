/** Бағалар шкаласы (максимумнан пайызбен) — жоғарыдан төмен. */
export const GRADE_BUCKETS = [
  { label: "90–100%", min: 90 },
  { label: "75–89%", min: 75 },
  { label: "60–74%", min: 60 },
  { label: "0–59%", min: 0 },
] as const;

/** Рейтингте тек үздік бестік көрсетіледі. */
export const RANKING_LIMIT = 5;
