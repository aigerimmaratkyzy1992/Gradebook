import { useEffect, useState } from "react";

const TICK_MS = 1000;

/** Мерзімге дейін қалған секундтар. Мерзім жоқ болса — null (таймерсіз тест). */
export function useCountdown(deadline: string | null): number | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadline) return;

    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [deadline]);

  if (!deadline) return null;
  return Math.max(0, Math.floor((new Date(deadline).getTime() - now) / 1000));
}
