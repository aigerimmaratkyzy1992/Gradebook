import { LogOut, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { ROLE_LABELS } from "@/constants/labels";
import { ROUTES } from "@/constants/routes";
import { getDisplayName, getInitials } from "@/lib/utils";
import { useCurrentUser, useSession } from "@/providers/SessionProvider";

export function UserMenu() {
  const user = useCurrentUser();
  const { signOut } = useSession();
  const navigate = useNavigate();

  function handleSignOut() {
    signOut();
    navigate(ROUTES.login, { replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Профиль"
        className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-transform duration-150 ease-out active:scale-95"
      >
        {getInitials(user.full_name, user.email)}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <DropdownMenuLabel>
          <p className="truncate font-medium">{getDisplayName(user)}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">
            {ROLE_LABELS[user.role]}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={ROUTES.profile}>
            <UserRound />
            Профиль
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleSignOut}>
          <LogOut />
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
