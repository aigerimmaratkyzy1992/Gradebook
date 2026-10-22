import { ArrowRight } from "lucide-react";

import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { NativeSelect } from "@/components/ui/NativeSelect";
import type { IOption, QuestionKind } from "@/types";

import { FALSE_LABEL, OPTION_SLOTS, TRUE_LABEL } from "../constants";
import { getIsTrueCorrect } from "../utils";

type OptionDraft = Pick<IOption, "text" | "is_correct" | "match_text">;

interface IOptionFieldsProps {
  /** Белгілердің id-іне префикс — бір бетте бірнеше форма болады. */
  idPrefix: string;
  /** Өңдеу кезінде бар нұсқалар, жаңа сұрақта — бос. */
  options: OptionDraft[];
}

interface IQuestionOptionFieldsProps extends IOptionFieldsProps {
  kind: QuestionKind;
}

/** Сұрақ түріне сай жауап редакторы. Өрістер FormData арқылы оқылады. */
export function QuestionOptionFields({ kind, idPrefix, options }: IQuestionOptionFieldsProps) {
  switch (kind) {
    case "short":
      return <ShortAnswerField idPrefix={idPrefix} options={options} />;
    case "true_false":
      return <TrueFalseField idPrefix={idPrefix} options={options} />;
    case "match":
      return <MatchPairsFields idPrefix={idPrefix} options={options} />;
    case "single":
    case "multiple":
      return <ChoiceFields options={options} isSingle={kind === "single"} />;
  }
}

function ShortAnswerField({ idPrefix, options }: IOptionFieldsProps) {
  return (
    <Field
      label="Правильный ответ"
      htmlFor={`${idPrefix}-answer`}
      hint="Ответ студента сравнивается без учёта регистра"
    >
      <Input
        id={`${idPrefix}-answer`}
        name="answer"
        defaultValue={options[0]?.text ?? ""}
        className="sm:max-w-sm"
        required
      />
    </Field>
  );
}

function TrueFalseField({ idPrefix, options }: IOptionFieldsProps) {
  const defaultValue = options.length === 0 || getIsTrueCorrect(options) ? "true" : "false";

  return (
    <Field label="Правильный ответ" htmlFor={`${idPrefix}-tf`}>
      <NativeSelect
        id={`${idPrefix}-tf`}
        name="tf"
        defaultValue={defaultValue}
        className="sm:max-w-xs"
      >
        <option value="true">{TRUE_LABEL}</option>
        <option value="false">{FALSE_LABEL}</option>
      </NativeSelect>
    </Field>
  );
}

interface IChoiceFieldsProps extends Pick<IOptionFieldsProps, "options"> {
  isSingle: boolean;
}

function ChoiceFields({ options, isSingle }: IChoiceFieldsProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-[13px] font-medium">
        Варианты{" "}
        <span className="font-normal text-muted-foreground">
          — отметьте {isSingle ? "правильный" : "правильные"}
        </span>
      </legend>
      {OPTION_SLOTS.map((slot) => {
        const option = options[slot];
        const optionLabel = `Вариант ${slot + 1}`;

        return (
          <div key={slot} className="flex items-center gap-3">
            {isSingle ? (
              <input
                type="radio"
                name="correct"
                value={slot}
                defaultChecked={option?.is_correct}
                aria-label={`${optionLabel} — правильный`}
                className="size-4 shrink-0 accent-primary"
              />
            ) : (
              <input
                type="checkbox"
                name={`correct_${slot}`}
                defaultChecked={option?.is_correct}
                aria-label={`${optionLabel} — правильный`}
                className="size-4 shrink-0 accent-primary"
              />
            )}
            <Input
              name={`option_${slot}`}
              defaultValue={option?.text ?? ""}
              placeholder={optionLabel}
              aria-label={optionLabel}
              className="sm:max-w-md"
            />
          </div>
        );
      })}
    </fieldset>
  );
}

function MatchPairsFields({ idPrefix, options }: IOptionFieldsProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-[13px] font-medium">
        Пары{" "}
        <span className="font-normal text-muted-foreground">— справа студент выберет из списка</span>
      </legend>
      {OPTION_SLOTS.map((slot) => {
        const option = options[slot];
        const leftId = `${idPrefix}-left-${slot}`;
        const rightId = `${idPrefix}-right-${slot}`;

        return (
          <div key={slot} className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
            <Label htmlFor={leftId} className="sr-only">
              Слева {slot + 1}
            </Label>
            <Input
              id={leftId}
              name={`option_${slot}`}
              defaultValue={option?.text ?? ""}
              placeholder={`Слева ${slot + 1}`}
            />
            <ArrowRight
              className="hidden size-4 text-muted-foreground sm:block"
              aria-hidden
            />
            <Label htmlFor={rightId} className="sr-only">
              Справа {slot + 1}
            </Label>
            <Input
              id={rightId}
              name={`match_${slot}`}
              defaultValue={option?.match_text ?? ""}
              placeholder={`Справа ${slot + 1}`}
            />
          </div>
        );
      })}
    </fieldset>
  );
}
