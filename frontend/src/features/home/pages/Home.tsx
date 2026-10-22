import { PageHeader } from "@/components/layout/PageHeader";
import { FormError } from "@/components/shared/FormError";
import { StatTile } from "@/components/shared/StatTile";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { ROLE_LABELS } from "@/constants/labels";
import { getIsStudent } from "@/lib/permissions";
import { getDisplayName } from "@/lib/utils";
import { useCurrentUser } from "@/providers/SessionProvider";

import { AssignmentsCard } from "../components/AssignmentsCard";
import { useMyAssignments } from "../hooks/useMyAssignments";
import { getIsPending, getStaffTiles, getStudentTiles } from "../utils";

export default function Home() {
  const user = useCurrentUser();
  const { data: assignments, isLoading, error } = useMyAssignments();

  if (isLoading) return <PageSkeleton />;

  const isStudent = getIsStudent(user.role);
  const tiles = isStudent ? getStudentTiles(assignments) : getStaffTiles(assignments);
  const pendingCount = assignments.filter(getIsPending).length;
  const summary = isStudent
    ? `${pendingCount} заданий ждут сдачи`
    : `${assignments.length} заданий в ваших дисциплинах`;

  return (
    <>
      <PageHeader
        title={`Привет, ${getDisplayName(user)}`}
        description={`${ROLE_LABELS[user.role]} · ${summary}`}
      />

      <div className="space-y-6">
        <FormError message={error} />

        <dl aria-label="Сводка" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map((tile) => (
            <StatTile key={tile.label} {...tile} />
          ))}
        </dl>

        <AssignmentsCard assignments={assignments} isStudent={isStudent} />
      </div>
    </>
  );
}
