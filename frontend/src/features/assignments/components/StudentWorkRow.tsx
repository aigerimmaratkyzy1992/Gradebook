import { ExternalLink } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId } from "react";

import { FileLink } from "@/components/shared/FileLink";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/Button";
import { COLLAPSE_MOTION } from "@/constants/motion";
import { formatDate } from "@/lib/date";
import { getDisplayName } from "@/lib/utils";
import type { IStudentWork } from "@/types";

import { ReviewForm } from "./ReviewForm";
import { SubmissionVersions } from "./SubmissionVersions";

interface IStudentWorkRowProps {
  work: IStudentWork;
  maxScore: number;
  isReviewing: boolean;
  onToggleReview: () => void;
  onReviewed: () => Promise<void>;
}

export function StudentWorkRow({
  work,
  maxScore,
  isReviewing,
  onToggleReview,
  onReviewed,
}: IStudentWorkRowProps) {
  const panelId = useId();
  const { student, submission } = work;
  const lastVersion = submission?.versions.at(-1);
  const hasScore = submission !== null && submission.score !== null;
  const hasOnlyText =
    lastVersion !== undefined &&
    Boolean(lastVersion.text) &&
    lastVersion.files.length === 0 &&
    !lastVersion.link;
  const shouldShowPreview = lastVersion !== undefined && !isReviewing;

  const meta = lastVersion
    ? [
        `Сдано ${formatDate(lastVersion.submitted_at)}`,
        submission && submission.versions.length > 1
          ? `попыток: ${submission.versions.length}`
          : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "Работа не сдана";

  return (
    <li>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
        <div className="min-w-0 flex-1 basis-48">
          <p className="truncate text-sm font-medium">{getDisplayName(student)}</p>
          <p className="text-xs text-muted-foreground">{meta}</p>
        </div>
        <div className="flex items-center gap-3">
          {hasScore && (
            <span className="text-sm font-semibold tabular-nums">
              {submission.score}
              <span className="font-normal text-muted-foreground">/{maxScore}</span>
            </span>
          )}
          <StatusBadge status={submission?.status ?? null} />
          {submission && (
            <Button
              variant={isReviewing ? "secondary" : "outline"}
              size="sm"
              aria-expanded={isReviewing}
              aria-controls={isReviewing ? panelId : undefined}
              onClick={onToggleReview}
            >
              {isReviewing ? "Свернуть" : "Проверить"}
            </Button>
          )}
        </div>
      </div>

      {shouldShowPreview && (
        <div className="flex flex-wrap items-center gap-2 px-5 pb-3.5">
          {lastVersion.files.map((file) => (
            <FileLink
              key={file.id}
              file={file}
              href={`/api/files/${file.id}`}
              className="w-auto max-w-full py-1.5 sm:max-w-64"
            />
          ))}
          {lastVersion.link && (
            <a
              href={lastVersion.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
            >
              <ExternalLink className="size-4 text-muted-foreground" aria-hidden />
              Ссылка
            </a>
          )}
          {hasOnlyText && <span className="text-sm text-muted-foreground">Текстовый ответ</span>}
        </div>
      )}

      <AnimatePresence initial={false}>
        {submission && isReviewing && (
          <motion.div
            id={panelId}
            key="review"
            {...COLLAPSE_MOTION}
            className="overflow-hidden"
          >
            <div className="space-y-5 border-t border-border bg-muted/40 px-5 py-4">
              <SubmissionVersions versions={submission.versions} />
              <ReviewForm submission={submission} maxScore={maxScore} onReviewed={onReviewed} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
