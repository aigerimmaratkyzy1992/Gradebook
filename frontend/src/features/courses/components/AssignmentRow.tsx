import { FileText, Paperclip } from "lucide-react";
import { Link } from "react-router";

import { Deadline } from "@/components/shared/Deadline";
import { ROUTES } from "@/constants/routes";
import type { IAssignment } from "@/types";

interface IAssignmentRowProps {
  assignment: Pick<IAssignment, "id" | "title" | "due_at" | "max_score" | "files">;
}

export function AssignmentRow({ assignment }: IAssignmentRowProps) {
  const hasFiles = assignment.files.length > 0;

  return (
    <li>
      <Link
        to={ROUTES.assignment(assignment.id)}
        className="flex flex-col gap-1 px-5 py-3 transition-colors duration-150 hover:bg-accent sm:flex-row sm:items-center sm:gap-4 sm:pl-11"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate text-sm">{assignment.title}</span>
          {hasFiles && (
            <>
              <Paperclip className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <span className="sr-only">есть файлы</span>
            </>
          )}
        </span>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-6 text-sm text-muted-foreground sm:pl-0">
          <Deadline dueAt={assignment.due_at} />
          <span className="tabular-nums">{assignment.max_score} б.</span>
        </span>
      </Link>
    </li>
  );
}
