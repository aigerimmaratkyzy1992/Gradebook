/** index.html ішіндегі алдын ала скрипт осы кілтті оқиды — екеуі бірдей болуы керек. */
export const THEME_STORAGE_KEY = "gradebook-theme";

export const THEMES = ["light", "dark", "system"] as const;

export type Theme = (typeof THEMES)[number];
