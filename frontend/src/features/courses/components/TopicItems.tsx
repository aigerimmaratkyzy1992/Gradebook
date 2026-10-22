import type { ITopic } from "@/types";

import { AssignmentRow } from "./AssignmentRow";
import { TestRow } from "./TestRow";

interface ITopicItemsProps {
  topic: Pick<ITopic, "assignments" | "tests">;
  canManage: boolean;
  /** Жаңа тапсырма формасы ашық тұрса, «бос» жазуы артық. */
  isAddingAssignment: boolean;
}

/** Тақырып ішіндегі тесттер мен тапсырмалар (тесттер жоғарыда). */
export function TopicItems({ topic, canManage, isAddingAssignment }: ITopicItemsProps) {
  const hasItems = topic.tests.length > 0 || topic.assignments.length > 0;

  if (!hasItems) {
    if (isAddingAssignment) return null;

    return (
      <p className="border-t border-border px-5 py-3 text-sm text-muted-foreground sm:pl-11">
        В теме пока нет заданий и тестов
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border border-t border-border">
      {topic.tests.map((test) => (
        <TestRow key={`test-${test.id}`} test={test} canManage={canManage} />
      ))}
      {topic.assignments.map((assignment) => (
        <AssignmentRow key={`assignment-${assignment.id}`} assignment={assignment} />
      ))}
    </ul>
  );
}
