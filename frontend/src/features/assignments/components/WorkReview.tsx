import { Users } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/shared/EmptyState";
import { FormError } from "@/components/shared/FormError";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardList,
  CardTitle,
} from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

import { useStudentWorks } from "../hooks/useStudentWorks";
import { StudentWorkRow } from "./StudentWorkRow";

interface IWorkReviewProps {
  assignmentId: number;
  maxScore: number;
}

const SKELETON_ROWS = [0, 1, 2] as const;

/** Преподаватель үшін: барлық студенттің жұмысы, нұсқалары және тексеру формасы. */
export function WorkReview({ assignmentId, maxScore }: IWorkReviewProps) {
  const { rows, isLoading, error, reload } = useStudentWorks(assignmentId);
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  const submittedCount = rows.filter((row) => row.submission).length;

  async function handleReviewed() {
    setReviewingId(null);
    await reload();
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Работы студентов</CardTitle>
          {!isLoading && (
            <CardDescription>
              Сдано {submittedCount} из {rows.length}
            </CardDescription>
          )}
        </div>
      </CardHeader>

      {error && (
        <CardContent>
          <FormError message={error} />
        </CardContent>
      )}

      {isLoading ? (
        <div className="space-y-3 border-t border-border px-5 py-4" role="status" aria-label="Загрузка">
          {SKELETON_ROWS.map((row) => (
            <Skeleton key={row} className="h-10" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        !error && (
          <EmptyState
            icon={Users}
            title="В группах дисциплины пока нет студентов"
            description="Назначьте дисциплине группы со студентами — их работы появятся здесь."
            className="border-t border-border"
          />
        )
      ) : (
        <CardList>
          {rows.map((row) => {
            const submissionId = row.submission?.id ?? null;
            const isReviewing = submissionId !== null && reviewingId === submissionId;

            return (
              <StudentWorkRow
                key={row.student.id}
                work={row}
                maxScore={maxScore}
                isReviewing={isReviewing}
                onToggleReview={() => setReviewingId(isReviewing ? null : submissionId)}
                onReviewed={handleReviewed}
              />
            );
          })}
        </CardList>
      )}
    </Card>
  );
}
