import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { api } from "./api";
import { clearToken, getToken } from "./auth";
import type { User } from "./types";

/** Ағымдағы пайдаланушыны жүктейді; токен жарамсыз болса — логин бетіне. */
export function useSession() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!getToken()) {
      navigate("/login", { replace: true });
      return;
    }
    api<User>("/api/users/me")
      .then(setUser)
      .catch(() => {
        clearToken();
        navigate("/login", { replace: true });
      });
  }, [navigate]);

  function logout() {
    clearToken();
    navigate("/login", { replace: true });
  }

  return { user, logout };
}
