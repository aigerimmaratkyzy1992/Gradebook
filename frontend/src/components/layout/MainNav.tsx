import { Menu } from "lucide-react";
import { motion } from "motion/react";
import { Link, NavLink } from "react-router";

import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { NAV_INDICATOR_TRANSITION } from "@/constants/motion";
import { NAV_ITEMS, type INavItem } from "@/constants/navigation";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

function getVisibleItems(role: Role): INavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}

/** Кең экранда — көлденең мәзір, белсенді пункт астында жылжымалы фон. */
export function DesktopNav({ role }: { role: Role }) {
  return (
    <nav className="hidden items-center gap-0.5 md:flex" aria-label="Основная навигация">
      {getVisibleItems(role).map(({ to, label, icon: Icon, isEnd }) => (
        <NavLink
          key={to}
          to={to}
          end={isEnd}
          className={({ isActive }) =>
            cn(
              "relative flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors duration-150",
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-lg bg-accent"
                  transition={NAV_INDICATOR_TRANSITION}
                />
              )}
              <Icon className="relative size-4" aria-hidden />
              <span className="relative">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/** Тар экранда — бір түйме, ішінде сол пункттер. */
export function MobileNav({ role }: { role: Role }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Меню" className="md:hidden">
          <Menu className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {getVisibleItems(role).map(({ to, label, icon: Icon }) => (
          <DropdownMenuItem key={to} asChild>
            <Link to={to}>
              <Icon />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
