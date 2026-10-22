import { Pencil, Plus, Trash2 } from "lucide-react";

import { ConfirmAction } from "@/components/shared/ConfirmAction";
import { IconAction } from "@/components/shared/IconAction";
import { Button } from "@/components/ui/Button";
import type { ITopic } from "@/types";

import { AddTestDialog } from "./AddTestDialog";

interface ITopicActionsProps {
  topic: Pick<ITopic, "id" | "title">;
  onAddAssignment: () => void;
  onRename: () => void;
  onDelete: () => Promise<void>;
}

/** Преподавательдің тақырып әрекеттері: тапсырма/тест қосу, атын өзгерту, өшіру. */
export function TopicActions({ topic, onAddAssignment, onRename, onDelete }: ITopicActionsProps) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" onClick={onAddAssignment} aria-label="Добавить задание">
        <Plus aria-hidden />
        Задание
      </Button>
      <AddTestDialog topicId={topic.id} />
      <IconAction label="Переименовать тему" onClick={onRename}>
        <Pencil />
      </IconAction>
      <ConfirmAction
        title={`Удалить тему «${topic.title}»?`}
        description="Все задания и тесты темы будут удалены."
        onConfirm={onDelete}
      >
        <IconAction label="Удалить тему" className="hover:text-destructive">
          <Trash2 />
        </IconAction>
      </ConfirmAction>
    </div>
  );
}
