/**
 * Анимацияның бір көзі. Минимализм: тек пайдаланушы өзі қосқан/өшірген тізім
 * элементтері, жиналмалы панельдер мен бет ауысуы анимацияланады.
 * Ұзақтықтар секундпен (motion солай күтеді).
 */
export const MOTION_DURATION = {
  fast: 0.15,
  base: 0.2,
  /** Навигациядағы белсенді пункт фонының жылжуы. */
  indicator: 0.35,
} as const;

const EASE_OUT = "easeOut";

/** Тізімге қосылған/өшірілген жол: тек мөлдірлік. `layout="position"`-пен бірге. */
export const FADE_ITEM_MOTION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: MOTION_DURATION.fast },
} as const;

/** Жиналмалы панель не биіктігі өзгеретін жол (тақырып, тексеру формасы, файл). */
export const COLLAPSE_MOTION = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: MOTION_DURATION.base, ease: EASE_OUT },
} as const;

/** Бет пен тест фазасының ауысуы: қысқа, аз ғана жылжу. */
export const PAGE_ENTER_MOTION = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: MOTION_DURATION.base, ease: EASE_OUT },
} as const;

export const PHASE_MOTION = {
  ...PAGE_ENTER_MOTION,
  exit: { opacity: 0, y: -4 },
} as const;

export const NAV_INDICATOR_TRANSITION = {
  type: "spring",
  bounce: 0.15,
  duration: MOTION_DURATION.indicator,
} as const;
