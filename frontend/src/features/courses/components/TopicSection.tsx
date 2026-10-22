import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { COLLAPSE_MOTION } from "@/constants/motion";
import { CreateAssignmentForm } from "@/features/assignments/components/CreateAssignmentForm";
import { api } from "@/lib/api";
import type { ITopic } from "@/types";

import { TopicActions } from "./TopicActions";
import { TopicForm } from "./TopicForm";
import { TopicItems } from "./TopicItems";
import { TopicToggle } from "./TopicToggle";

interface ITopicSectionProps {
  topic: ITopic;
  canManage: boolean;
  onChanged: () => Promise<void>;
}

/** Бір тақырып: жиналмалы тізім (тесттер + тапсырмалар) және преподаватель әрекеттері. */
export function TopicSection({ topic, canManage, onChanged }: ITopicSectionProps) {
  const panelId = useId();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);

  const canShowActions = canManage && !isRenaming;

  function handleStartAssignment() {
    setIsAddingAssignment(true);
    setIsExpanded(true);
  }

  async function handleRename(title: string) {
    await api(`/api/topics/${topic.id}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    });
    setIsRenaming(false);
    toast.success("Тема переименована");
    await onChanged();
  }

  async function handleDelete() {
    await api(`/api/topics/${topic.id}`, { method: "DELETE" });
    toast.success("Тема удалена");
    await onChanged();
  }

  async function handleAssignmentCreated() {
    setIsAddingAssignment(false);
    await onChanged();
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3">
        {isRenaming ? (
          <TopicForm
            defaultTitle={topic.title}
            submitLabel="Сохранить"
            onSubmit={handleRename}
            onCancel={() => setIsRenaming(false)}
            shouldAutoFocus
            className="flex-1"
          />
        ) : (
          <TopicToggle
            topic={topic}
            isExpanded={isExpanded}
            panelId={panelId}
            onToggle={() => setIsExpanded(!isExpanded)}
          />
        )}

        {canShowActions && (
          <TopicActions
            topic={topic}
            onAddAssignment={handleStartAssignment}
            onRename={() => setIsRenaming(true)}
            onDelete={handleDelete}
          />
        )}
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div id={panelId} key="panel" {...COLLAPSE_MOTION} className="overflow-hidden">
            {isAddingAssignment && (
              <CreateAssignmentForm
                topicId={topic.id}
                onCreated={handleAssignmentCreated}
                onCancel={() => setIsAddingAssignment(false)}
              />
            )}
            <TopicItems
              topic={topic}
              canManage={canManage}
              isAddingAssignment={isAddingAssignment}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
