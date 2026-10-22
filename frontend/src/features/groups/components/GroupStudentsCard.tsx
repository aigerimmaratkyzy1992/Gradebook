import { UserRound } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/Badge";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardList,
  CardTitle,
} from "@/components/ui/Card";
import { FADE_ITEM_MOTION } from "@/constants/motion";
import type { IUser } from "@/types";

import { StudentPicker } from "./StudentPicker";
import { StudentRow } from "./StudentRow";

type StudentOption = Pick<IUser, "id" | "email" | "full_name">;

interface IGroupStudentsCardProps {
  members: StudentOption[];
  /** Топта әлі жоқ студенттер — таңдау өрісі үшін. */
  candidates: StudentOption[];
  onAdd: (email: string) => Promise<void>;
  onRemove: (studentId: number) => Promise<void>;
}

/** Топ құрамы: студент қосу формасы және мүшелер тізімі. */
export function GroupStudentsCard({ members, candidates, onAdd, onRemove }: IGroupStudentsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Студенты</CardTitle>
        <CardAction>
          <Badge variant="secondary" className="tabular-nums">
            {members.length}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <StudentPicker students={candidates} onAdd={onAdd} />
      </CardContent>

      {members.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title="В группе пока нет студентов"
          description="Выберите студента в списке выше и нажмите «Добавить»."
          className="border-t border-border"
        />
      ) : (
        <CardList>
          <AnimatePresence initial={false}>
            {members.map((student) => (
              <motion.li key={student.id} layout="position" {...FADE_ITEM_MOTION}>
                <StudentRow student={student} onRemove={() => onRemove(student.id)} />
              </motion.li>
            ))}
          </AnimatePresence>
        </CardList>
      )}
    </Card>
  );
}
