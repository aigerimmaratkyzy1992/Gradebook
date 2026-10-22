import { UsersRound } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useState } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormError } from "@/components/shared/FormError";
import { Card, CardDescription, CardHeader, CardList, CardTitle } from "@/components/ui/Card";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useCurrentUser, useSession } from "@/providers/SessionProvider";
import type { IUser } from "@/types";

import { CreateUserForm } from "../components/CreateUserForm";
import { ResetPasswordNotice } from "../components/ResetPasswordNotice";
import { UserRow } from "../components/UserRow";
import { useUsers } from "../hooks/useUsers";
import type { IPasswordReset } from "../types";

export default function Users() {
  const currentUser = useCurrentUser();
  const { setUser } = useSession();
  const { data: users, isLoading, error, reload } = useUsers();
  const [reset, setReset] = useState<IPasswordReset | null>(null);

  async function handleSaved(updated: IUser) {
    // Admin өзін өңдесе, header-дегі аты да жаңаруы керек.
    if (updated.id === currentUser.id) setUser(updated);
    await reload();
  }

  if (isLoading) return <PageSkeleton />;

  return (
    <>
      <PageHeader title="Пользователи" description="Аккаунты, роли и доступ" />

      <div className="space-y-6">
        <CreateUserForm onCreated={reload} />

        <FormError message={error} />

        {reset && <ResetPasswordNotice reset={reset} onDismiss={() => setReset(null)} />}

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Все пользователи</CardTitle>
              <CardDescription>Всего: {users.length}</CardDescription>
            </div>
          </CardHeader>
          {users.length === 0 ? (
            <EmptyState
              icon={UsersRound}
              className="border-t border-border"
              title="Пока нет пользователей"
              description="Добавьте первого пользователя через форму выше"
            />
          ) : (
            <CardList>
              <AnimatePresence initial={false}>
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    isSelf={user.id === currentUser.id}
                    onSaved={handleSaved}
                    onDeleted={reload}
                    onPasswordReset={setReset}
                  />
                ))}
              </AnimatePresence>
            </CardList>
          )}
        </Card>
      </div>
    </>
  );
}
