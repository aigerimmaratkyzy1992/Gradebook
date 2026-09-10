import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

import { ROLE_LABELS, type User } from "../lib/types";

function initials(user: User | null) {
  const source = user?.full_name ?? user?.email ?? "";
  const parts = source.split(/[\s.@_-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

type Props = {
  user: User | null;
  onLogout: () => void;
};

export function ProfileMenu({ user, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Профиль"
        className="flex size-11 items-center justify-center rounded-full border border-line bg-surface text-sm font-semibold text-ink transition-transform duration-150 ease-out hover:border-ink active:scale-[0.94]"
      >
        {initials(user)}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-2 w-56 origin-top-right rounded-2xl border border-line bg-surface p-1.5 transition duration-150 ease-out starting:scale-95 starting:opacity-0">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-ink">
              {user?.full_name ?? user?.email}
            </p>
            {user && <p className="text-xs text-muted">{ROLE_LABELS[user.role]}</p>}
          </div>
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3 py-2 text-sm text-muted transition-colors duration-150 hover:bg-canvas hover:text-ink"
          >
            Профиль
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="w-full rounded-xl px-3 py-2 text-left text-sm text-muted transition-colors duration-150 hover:bg-canvas hover:text-ink"
          >
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
