import { ArrowRight } from "lucide-react";
import { useId } from "react";

import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { NativeSelect } from "@/components/ui/NativeSelect";
import type { ITakeQuestion } from "@/types";

import type { IAnswer } from "../types";

interface ITakeQuestionCardProps {
  question: ITakeQuestion;
  index: number;
  answer: IAnswer | undefined;
  onAnswer: (patch: IAnswer) => void;
}

const CHOICE_ROW_CLASS =
  "flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm transition-colors duration-150 hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-accent";

export function TakeQuestionCard({ question, index, answer, onAnswer }: ITakeQuestionCardProps) {
  const headingId = useId();

  return (
    <Card>
      <CardContent className="space-y-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <h2 id={headingId} className="text-sm font-medium whitespace-pre-line">
            <span className="text-muted-foreground">{index + 1}. </span>
            {question.text}
          </h2>
          <Badge variant="outline">{question.points} б.</Badge>
        </div>

        <AnswerInput
          question={question}
          answer={answer}
          onAnswer={onAnswer}
          headingId={headingId}
        />
      </CardContent>
    </Card>
  );
}

interface IAnswerInputProps extends Omit<ITakeQuestionCardProps, "index"> {
  headingId: string;
}

/** Сұрақ түріне сай жауап өрісі. */
function AnswerInput({ question, answer, onAnswer, headingId }: IAnswerInputProps) {
  if (question.kind === "single" || question.kind === "true_false") {
    return (
      <div role="radiogroup" aria-labelledby={headingId} className="grid gap-2">
        {question.options.map((option) => (
          <label key={option.id} className={CHOICE_ROW_CLASS}>
            <input
              type="radio"
              name={`q_${question.id}`}
              checked={answer?.option_id === option.id}
              onChange={() => onAnswer({ option_id: option.id })}
              className="size-4 shrink-0 accent-primary"
            />
            {option.text}
          </label>
        ))}
      </div>
    );
  }

  if (question.kind === "multiple") {
    const selectedIds = answer?.option_ids ?? [];

    return (
      <fieldset aria-labelledby={headingId} className="grid gap-2">
        <p className="text-xs text-muted-foreground">Можно выбрать несколько вариантов</p>
        {question.options.map((option) => (
          <label key={option.id} className={CHOICE_ROW_CLASS}>
            <input
              type="checkbox"
              checked={selectedIds.includes(option.id)}
              onChange={(event) =>
                onAnswer({
                  option_ids: event.target.checked
                    ? [...selectedIds, option.id]
                    : selectedIds.filter((item) => item !== option.id),
                })
              }
              className="size-4 shrink-0 accent-primary"
            />
            {option.text}
          </label>
        ))}
      </fieldset>
    );
  }

  if (question.kind === "short") {
    return (
      <Input
        aria-labelledby={headingId}
        value={answer?.text ?? ""}
        onChange={(event) => onAnswer({ text: event.target.value })}
        placeholder="Ваш ответ"
        className="sm:max-w-sm"
      />
    );
  }

  return <MatchInput question={question} answer={answer} onAnswer={onAnswer} />;
}

function MatchInput({ question, answer, onAnswer }: Omit<IAnswerInputProps, "headingId">) {
  const pairs = answer?.pairs ?? {};

  return (
    <div className="grid gap-2">
      {question.options.map((option) => {
        const selectId = `match-${question.id}-${option.id}`;

        return (
          <div
            key={option.id}
            className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"
          >
            <Label htmlFor={selectId} className="text-sm font-normal">
              {option.text}
            </Label>
            <ArrowRight className="hidden size-4 text-muted-foreground sm:block" aria-hidden />
            <NativeSelect
              id={selectId}
              value={pairs[option.id] ?? ""}
              onChange={(event) =>
                onAnswer({ pairs: { ...pairs, [option.id]: event.target.value } })
              }
            >
              <option value="">— выберите —</option>
              {question.match_targets.map((target) => (
                <option key={target} value={target}>
                  {target}
                </option>
              ))}
            </NativeSelect>
          </div>
        );
      })}
    </div>
  );
}
