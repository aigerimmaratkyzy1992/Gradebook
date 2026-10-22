import { Layers } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardDescription, CardHeader, CardList, CardTitle } from "@/components/ui/Card";
import { COLLAPSE_MOTION } from "@/constants/motion";
import { api } from "@/lib/api";
import type { ITopic } from "@/types";

import { TopicForm } from "./TopicForm";
import { TopicSection } from "./TopicSection";

interface ITopicsCardProps {
  courseId: number;
  topics: ITopic[];
  canManage: boolean;
  onChanged: () => Promise<void>;
}

export function TopicsCard({ courseId, topics, canManage, onChanged }: ITopicsCardProps) {
  const hasTopics = topics.length > 0;

  async function handleAddTopic(title: string) {
    await api(`/api/courses/${courseId}/topics`, {
      method: "POST",
      body: JSON.stringify({ title }),
    });
    toast.success("Тема добавлена");
    await onChanged();
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Темы · {topics.length}</CardTitle>
          <CardDescription>Задания и тесты сгруппированы по темам</CardDescription>
        </div>
      </CardHeader>

      {canManage && (
        <TopicForm
          submitLabel="Добавить тему"
          onSubmit={handleAddTopic}
          className="border-t border-border px-5 py-4"
        />
      )}

      {hasTopics ? (
        <CardList>
          <AnimatePresence initial={false}>
            {topics.map((topic) => (
              <motion.li
                key={topic.id}
                layout="position"
                {...COLLAPSE_MOTION}
                className="overflow-hidden"
              >
                <TopicSection topic={topic} canManage={canManage} onChanged={onChanged} />
              </motion.li>
            ))}
          </AnimatePresence>
        </CardList>
      ) : (
        <EmptyState
          icon={Layers}
          title="В дисциплине пока нет тем"
          description={
            canManage
              ? "Добавьте первую тему — в ней появятся задания и тесты."
              : "Преподаватель ещё не добавил материалы."
          }
          className="border-t border-border"
        />
      )}
    </Card>
  );
}
