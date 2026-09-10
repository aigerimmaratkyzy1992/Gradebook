import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { api } from "../lib/api";
import { formatDate } from "../lib/date";

type Notification = {
  id: number;
  text: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

type Payload = { unread: number; items: Notification[] };

export function NotificationsMenu({ enabled }: { enabled: boolean }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Payload>({ unread: 0, items: [] });
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setData(await api<Payload>("/api/notifications").catch(() => ({ unread: 0, items: [] })));
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void load();
    // Жаңа хабарламалар фонда келіп тұрады.
    const timer = setInterval(() => void load(), 60_000);
    return () => clearInterval(timer);
  }, [enabled, load]);

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

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && data.unread > 0) {
      await api("/api/notifications/read", { method: "POST" }).catch(() => {});
      setData((current) => ({ ...current, unread: 0 }));
    }
  }

  if (!enabled) return null;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => void toggle()}
        aria-label="Уведомления"
        className="relative flex size-11 items-center justify-center rounded-full border border-line bg-surface text-ink transition-transform duration-150 ease-out hover:border-ink active:scale-[0.94]"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
          <path d="M13.7 20a2 2 0 0 1-3.4 0" />
        </svg>
        {data.unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">
            {data.unread > 9 ? "9+" : data.unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-2 w-80 origin-top-right overflow-hidden rounded-2xl border border-line bg-surface transition duration-150 ease-out starting:scale-95 starting:opacity-0">
          {data.items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">
              Уведомлений пока нет
            </p>
          ) : (
            <ul className="max-h-96 divide-y divide-line overflow-y-auto">
              {data.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      if (item.link) navigate(item.link);
                    }}
                    className="block w-full px-4 py-3 text-left transition-colors duration-150 hover:bg-canvas"
                  >
                    <p className="text-sm text-ink">{item.text}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatDate(item.created_at)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
