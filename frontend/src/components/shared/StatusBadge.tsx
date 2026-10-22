import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { NOT_SUBMITTED_LABEL, STATUS_LABELS } from "@/constants/labels";
import type { SubmissionStatus } from "@/types";

const STATUS_VARIANTS: Record<SubmissionStatus | "none", BadgeVariant> = {
  none: "outline",
  submitted: "secondary",
  reviewed: "success",
  revision: "destructive",
};

export function StatusBadge({ status }: { status: SubmissionStatus | null }) {
  return (
    <Badge variant={STATUS_VARIANTS[status ?? "none"]}>
      {status ? STATUS_LABELS[status] : NOT_SUBMITTED_LABEL}
    </Badge>
  );
}
