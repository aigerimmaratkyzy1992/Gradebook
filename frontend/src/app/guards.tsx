import { Navigate, Outlet, useLocation } from "react-router";

import { PageSkeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/constants/routes";
import { getRedirectPath } from "@/lib/redirect";
import { useSession } from "@/providers/SessionProvider";
import type { Role } from "@/types";

/** Кірмеген пайдаланушыны логинге жібереді; кейін қайтып келу үшін толық жолды сақтайды. */
export function RequireAuth() {
  const { user, isLoading } = useSession();
  const { pathname, search, hash } = useLocation();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-24">
        <PageSkeleton />
      </div>
    );
  }
  if (!user) {
    return <Navigate to={ROUTES.login} replace state={{ from: pathname + search + hash }} />;
  }
  return <Outlet />;
}

/** Рөлге қарай қорғау: рұқсат жоқ болса — басты бетке. */
export function RequireRole({ roles }: { roles: readonly Role[] }) {
  const { user } = useSession();
  if (!user || !roles.includes(user.role)) return <Navigate to={ROUTES.home} replace />;
  return <Outlet />;
}

/**
 * Логин/тіркелу беттері тек кірмегендерге. Кіру сәтті болғанда редиректті
 * осы жер ғана жасайды — беттің өзі navigate шақырмайды, жарыс болмайды.
 */
export function GuestOnly() {
  const { user, isLoading } = useSession();
  const location = useLocation();

  if (isLoading) return null;
  if (user) return <Navigate to={getRedirectPath(location.state)} replace />;
  return <Outlet />;
}
