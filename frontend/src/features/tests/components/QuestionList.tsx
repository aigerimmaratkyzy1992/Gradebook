import { ListChecks } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardDescription, CardHeader, CardList, CardTitle } from "@/components/ui/Card";
import type { IQuestion } from "@/types";

import type { IQuestionPayload } from "../types";

import { QuestionEditor } from "./QuestionEditor";
import { QuestionItem } from "./QuestionItem";

interface IQuestionListProps {
  questions: IQuestion[];
  maxScore: number;
  onUpdate: (questionId: number, payload: IQuestionPayload) => Promise<void>;
  onDelete: (questionId: number) => Promise<void>;
}

export function QuestionList({ questions, maxScore, onUpdate, onDelete }: IQuestionListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const hasQuestions = questions.length > 0;

  async function handleUpdate(questionId: number, payload: IQuestionPayload) {
    await onUpdate(questionId, payload);
    setEditingId(null);
    toast.success("Вопрос сохранён");
  }

  async function handleDelete(questionId: number) {
    await onDelete(questionId);
    toast.success("Вопрос удалён");
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Вопросы · {questions.length}</CardTitle>
          <CardDescription>Всего {maxScore} баллов</CardDescription>
        </div>
      </CardHeader>

      {hasQuestions ? (
        <CardList>
          <AnimatePresence initial={false}>
            {questions.map((question, index) => (
              <motion.li
                key={question.id}
                layout="position"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="px-5 py-4"
              >
                {editingId === question.id ? (
                  <QuestionEditor
                    question={question}
                    submitLabel="Сохранить"
                    onSubmit={(payload) => handleUpdate(question.id, payload)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <QuestionItem
                    question={question}
                    index={index}
                    onEdit={() => setEditingId(question.id)}
                    onDelete={() => handleDelete(question.id)}
                  />
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </CardList>
      ) : (
        <EmptyState
          icon={ListChecks}
          title="В тесте пока нет вопросов"
          description="Добавьте первый вопрос с помощью формы выше."
          className="border-t border-border"
        />
      )}
    </Card>
  );
}
