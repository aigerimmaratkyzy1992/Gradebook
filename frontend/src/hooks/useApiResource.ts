import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

import { api, getErrorMessage } from "@/lib/api";

export interface IApiResource<T> {
  data: T;
  /** Мутация жауабы толық объектіні қайтарса — қайта сұрамай, осымен жаңартамыз. */
  setData: Dispatch<SetStateAction<T>>;
  /** Ағымдағы `path` бойынша алғашқы жауап әлі келмеген. `reload` бұл күйді қоспайды. */
  isLoading: boolean;
  error: string;
  /** Ешқашан лақтырмайды: қате `error` өрісіне жазылады. */
  reload: () => Promise<void>;
}

/**
 * GET-ресурсты жүктейтін жалғыз механизм. `path === null` — сұрау жіберілмейді
 * (мыс. тізім тек admin-ге керек). Ескірген жауаптар (path ауысқан, бет жабылған
 * немесе жаңа reload басталған) күйді өзгертпейді.
 */
export function useApiResource<T>(path: string | null, initial: T): IApiResource<T> {
  const [data, setData] = useState<T>(initial);
  const [error, setError] = useState("");
  const [settledPath, setSettledPath] = useState<string | null>(null);
  // Әр сұрауға реттік нөмір: тек ең соңғысының жауабы қабылданады.
  const requestIdRef = useRef(0);

  const load = useCallback(async (targetPath: string) => {
    const requestId = ++requestIdRef.current;
    try {
      const loaded = await api<T>(targetPath);
      if (requestId !== requestIdRef.current) return;
      setData(loaded);
      setError("");
    } catch (caught) {
      if (requestId !== requestIdRef.current) return;
      setError(getErrorMessage(caught));
    } finally {
      if (requestId === requestIdRef.current) setSettledPath(targetPath);
    }
  }, []);

  useEffect(() => {
    if (path === null) return;
    void load(path);
    return () => {
      // path ауысса немесе бет жабылса, ұшып жүрген жауап елеусіз қалады.
      requestIdRef.current += 1;
    };
  }, [path, load]);

  const reload = useCallback(async () => {
    if (path !== null) await load(path);
  }, [path, load]);

  return {
    data,
    setData,
    isLoading: path !== null && settledPath !== path,
    error,
    reload,
  };
}
