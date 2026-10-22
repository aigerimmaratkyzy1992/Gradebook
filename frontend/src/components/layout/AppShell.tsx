import { GraduationCap } from "lucide-react";
import { motion } from "motion/react";
import { Link, Outlet, useLocation } from "react-router";

import { PAGE_ENTER_MOTION } from "@/constants/motion";
import { ROUTES } from "@/constants/routes";
import { useCurrentUser } from "@/providers/SessionProvider";

import { DesktopNav, MobileNav } from "./MainNav";
import { NotificationsMenu } from "./NotificationsMenu";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

export function Logo() {
  return (
    <Link to={ROUTES.home} className="flex shrink-0 items-center gap-2 font-semibold">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <GraduationCap className="size-[18px]" aria-hidden />
      </span>
      <span className="text-[17px] tracking-tight">GradeBook</span>
    </Link>
  );
}

/** Барлық ішкі беттің қаңқасы: жабысқақ header + контент. */
export function AppShell() {
  const user = useCurrentUser();
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-5">
          <MobileNav role={user.role} />
          <Logo />
          <div className="ml-4 flex-1">
            <DesktopNav role={user.role} />
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationsMenu />
            <span className="ml-1">
              <UserMenu />
            </span>
          </div>
        </div>
      </header>

      <motion.main
        key={pathname}
        {...PAGE_ENTER_MOTION}
        className="mx-auto max-w-5xl px-4 py-8 sm:px-5"
      >
        <Outlet />
      </motion.main>
    </div>
  );
}
