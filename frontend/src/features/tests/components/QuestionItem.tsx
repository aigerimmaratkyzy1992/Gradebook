import { ArrowRight, Check, Dot, Pencil, Trash2 } from "lucide-react";

import { ConfirmAction } from "@/components/shared/ConfirmAction";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { KIND_LABELS } from "@/constants/labels";
import { cn } from "@/lib/utils";
import type { IOption, IQuestion } from "@/types";

interface IQuestionItemProps {
  question: Pick<IQuestion, "kind" | "text" | "points" | "options">;
  index: number;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

/** Сұрақтың оқу көрінісі: мәтін, түрі, балы және дұрыс жауаптар белгісі. */
export function QuestionItem({ question, index, onEdit, onDelete }: IQuestionItemProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground tabular-nums">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-sm font-medium whitespace-pre-line">{question.text}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{KIND_LABELS[question.kind]}</Badge>
            <span className="text-xs text-muted-foreground">{question.points} б.</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil aria-hidden />
            <span className="sr-only sm:not-sr-only">Изменить</span>
          </Button>
          <ConfirmAction
            title={`Удалить вопрос ${index + 1}?`}
            description="Ответы студентов на этот вопрос тоже будут удалены."
            onConfirm={onDelete}
          >
            <Button variant="ghost" size="sm" className="hover:text-destructive">
              <Trash2 aria-hidden />
              <span className="sr-only sm:not-sr-only">Удалить</span>
            </Button>
          </ConfirmAction>
        </div>
      </div>

      <ul className="space-y-1 pl-9">
        {question.options.map((option) => (
          <OptionLine key={option.id} option={option} />
        ))}
      </ul>
    </div>
  );
}

function OptionLine({ option }: { option: Pick<IOption, "text" | "is_correct" | "match_text"> }) {
  if (option.match_text) {
    return (
      <li className="flex items-center gap-2 text-sm">
        <span>{option.text}</span>
        <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <span>{option.match_text}</span>
      </li>
    );
  }

  const Icon = option.is_correct ? Check : Dot;

  return (
    <li
      className={cn(
        "flex items-center gap-2 text-sm",
        option.is_correct ? "font-medium" : "text-muted-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {option.text}
      {option.is_correct && <span className="sr-only">(правильный)</span>}
    </li>
  );
}
