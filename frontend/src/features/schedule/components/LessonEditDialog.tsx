import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import type { ICourse, IGroup, ILesson } from "@/types";

import type { LessonSlot } from "../types";
import { LessonForm } from "./LessonForm";

interface ILessonEditDialogProps {
  /** null — терезе жабық. */
  lesson: ILesson | null;
  courses: Pick<ICourse, "id" | "name" | "groups">[];
  groups: Pick<IGroup, "id" | "name">[];
  onClose: () => void;
  onSubmit: (slot: LessonSlot) => Promise<void>;
}

export function LessonEditDialog({
  lesson,
  courses,
  groups,
  onClose,
  onSubmit,
}: ILessonEditDialogProps) {
  return (
    <Dialog
      open={lesson !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Изменить занятие</DialogTitle>
          <DialogDescription>{lesson?.course.name}</DialogDescription>
        </DialogHeader>
        {lesson && (
          <LessonForm
            key={lesson.id}
            lesson={lesson}
            courses={courses}
            groups={groups}
            submitLabel="Сохранить"
            onSubmit={onSubmit}
            onCancel={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
