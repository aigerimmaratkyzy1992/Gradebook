import { Bell, BellOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/date";
import type { INotificationFeed } from "@/types";

const POLL_INTERVAL_MS = 60_000;
const MAX_BADGE_COUNT = 9;
const EMPTY_FEED: INotificationFeed = { unread: 0, items: [] };

export function NotificationsMenu() {
  const navigate = useNavigate();
  const [feed, setFeed] = useState<INotificationFeed>(EMPTY_FEED);

  const loadFeed = useCallback(async () => {
    try {
      setFeed(await api<INotificationFeed>("/api/notifications"));
    } catch {
      // Фондық сұрау: уақытша қатеде соңғы белгілі тізімді қалдырамыз.
    }
  }, []);

  useEffect(() => {
    void loadFeed();
    // Жасырын қойындыда серверді бекер сұрамаймыз; оралғанда бірден жаңартамыз.
    const timer = setInterval(() => {
      if (!document.hidden) void loadFeed();
    }, POLL_INTERVAL_MS);
    const handleVisibility = () => {
      if (!document.hidden) void loadFeed();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadFeed]);

  async function handleOpenChange(isOpen: boolean) {
    if (!isOpen || feed.unread === 0) return;
    setFeed((current) => ({ ...current, unread: 0 }));
    // Белгілеу сәтсіз болса, сервердегі нақты санды қайта аламыз.
    await api("/api/notifications/read", { method: "POST" }).catch(() => loadFeed());
  }

  const hasUnread = feed.unread > 0;

  return (
    <DropdownMenu onOpenChange={(isOpen) => void handleOpenChange(isOpen)}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Уведомления" className="relative">
          <Bell className="size-[18px]" />
          {hasUnread && (
            <span className="absolute top-1.5 right-1.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-4 font-semibold text-primary-foreground">
              {feed.unread > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : feed.unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <p className="border-b border-border px-4 py-3 text-sm font-semibold">Уведомления</p>
        {feed.items.length === 0 ? (
          <EmptyState icon={BellOff} title="Уведомлений пока нет" className="py-8" />
        ) : (
          <div className="max-h-96 overflow-y-auto p-1">
            {feed.items.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onSelect={() => item.link && navigate(item.link)}
                className="flex-col items-start gap-0.5 px-3 py-2.5"
              >
                <span className="text-sm text-foreground">{item.text}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(item.created_at)}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
