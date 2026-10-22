import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ITopic } from "@/types";

import { getTopicSummary } from "../utils";

interface ITopicToggleProps {
  topic: Pick<ITopic, "title" | "position" | "assignments" | "tests">;
  isExpanded: boolean;
  /** Жиналмалы панельдің id-і — aria-controls үшін. */
  panelId: string;
  onToggle: () => void;
}

/** Тақырып атауы мен қысқаша мазмұны; басқанда тізім жиналады/ашылады. */
export function TopicToggle({ topic, isExpanded, panelId, onToggle }: ITopicToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isExpanded}
      aria-controls={isExpanded ? panelId : undefined}
      className="-mx-1 flex min-w-0 flex-1 basis-56 items-center gap-2 rounded-md px-1 py-1 text-left"
    >
      <ChevronRight
        className={cn(
          "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
          isExpanded && "rotate-90",
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          Тема {topic.position}. {topic.title}
        </span>
        <span className="block text-xs text-muted-foreground">{getTopicSummary(topic)}</span>
      </span>
    </button>
  );
}
