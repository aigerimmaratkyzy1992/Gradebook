import { motion } from "motion/react";
import type { ReactNode } from "react";

import { PAGE_ENTER_MOTION } from "@/constants/motion";

import { Logo } from "./AppShell";
import { ThemeToggle } from "./ThemeToggle";

interface IAuthLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  /** Карточка астындағы сілтемелер (Регистрация, Забыли пароль…). */
  footer?: ReactNode;
}

/** Кіру/тіркелу беттері: ортадағы шағын карточка. */
export function AuthLayout({ title, description, children, footer }: IAuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-16 items-center justify-between px-4 sm:px-6">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <motion.div
          {...PAGE_ENTER_MOTION}
          className="w-full max-w-sm"
        >
          <div className="rounded-xl border border-border bg-card p-6 sm:p-7">
            <div className="mb-6">
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              {description && (
                <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {children}
          </div>
          {footer && (
            <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
