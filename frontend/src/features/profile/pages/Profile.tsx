import { PageHeader } from "@/components/layout/PageHeader";

import { PasswordForm } from "../components/PasswordForm";
import { ProfileForm } from "../components/ProfileForm";

export default function Profile() {
  return (
    <>
      <PageHeader title="Профиль" description="Личные данные и безопасность" />
      <div className="space-y-6">
        <ProfileForm />
        <PasswordForm />
      </div>
    </>
  );
}
