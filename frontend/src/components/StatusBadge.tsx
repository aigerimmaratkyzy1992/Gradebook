import { STATUS_LABELS, type SubmissionStatus } from "../lib/types";

const TONES: Record<SubmissionStatus | "none", string> = {
  none: "border-line text-muted",
  submitted: "border-ink text-ink",
  reviewed: "border-green-600 text-green-700",
  revision: "border-red-500 text-red-600",
};

export function StatusBadge({ status }: { status: SubmissionStatus | null }) {
  const key = status ?? "none";
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${TONES[key]}`}
    >
      {status ? STATUS_LABELS[status] : "Не сдано"}
    </span>
  );
}
