import { createContext, use, useCallback, useEffect, useState, type ReactNode } from "react";

import { api, setUnauthorizedHandler } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/auth";
import type { IUser } from "@/types";

interface ISessionContext {
  user: IUser | null;
  /** Тек бастапқы жүктеу: токен бар, бірақ пайдаланушы әлі белгісіз. */
  isLoading: boolean;
  /** Токенді сақтап, пайдаланушыны жүктейді; сәтсіз болса — қате лақтырады. */
  signIn: (token: string) => Promise<void>;
  signOut: () => void;
  /** Пароль ауысқанда сервер жаңа токен береді — пайдаланушыны қайта жүктемей ауыстырамыз. */
  replaceToken: (token: string) => void;
  /** Профиль өзгергенде жаңа деректерді бүкіл қосымшаға таратады. */
  setUser: (user: IUser) => void;
}

const SessionContext = createContext<ISessionContext | null>(null);

const fetchCurrentUser = () => api<IUser>("/api/users/me");

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(getToken()));

  const signOut = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  useEffect(() => {
    if (!getToken()) return;

    fetchCurrentUser()
      .then(setUser)
      .catch(() => {
        // 401 болса, api сессияны өзі тазалайды. Сервер уақытша қолжетімсіз
        // болса, токенді сақтаймыз — бет қайта жүктелгенде пайдаланушы кіреді.
      })
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = useCallback(async (token: string) => {
    setToken(token);
    try {
      setUser(await fetchCurrentUser());
    } catch (caught) {
      clearToken();
      throw caught;
    }
  }, []);

  return (
    <SessionContext
      value={{ user, isLoading, signIn, signOut, replaceToken: setToken, setUser }}
    >
      {children}
    </SessionContext>
  );
}

export function useSession(): ISessionContext {
  const context = use(SessionContext);
  if (!context) throw new Error("useSession must be used inside <SessionProvider>");
  return context;
}

/** Қорғалған беттер үшін: RequireAuth ішінде пайдаланушы әрқашан бар. */
export function useCurrentUser(): IUser {
  const { user } = useSession();
  if (!user) throw new Error("useCurrentUser must be used inside <RequireAuth>");
  return user;
}
