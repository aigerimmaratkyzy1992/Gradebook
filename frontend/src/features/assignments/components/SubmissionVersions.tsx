import { ExternalLink } from "lucide-react";

import { FileLink } from "@/components/shared/FileLink";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/date";
import type { ISubmissionVersion } from "@/types";

interface ISubmissionVersionsProps {
  versions: ISubmissionVersion[];
}

/** Тапсыру тарихы: әр әрекет — мәтін, сілтеме, файлдар; ең жаңасы жоғарыда. */
export function SubmissionVersions({ versions }: ISubmissionVersionsProps) {
  const newestFirst = [...versions].reverse();
  const hasSeveral = versions.length > 1;

  return (
    <ol className="divide-y divide-border rounded-lg border border-border bg-card">
      {newestFirst.map((version, index) => {
        const isLatest = index === 0;

        return (
          <li key={version.id} className="space-y-2.5 px-4 py-3">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                Попытка {versions.length - index}
              </span>
              <time dateTime={version.submitted_at}>{formatDate(version.submitted_at)}</time>
              {isLatest && hasSeveral && <Badge variant="outline">последняя</Badge>}
            </p>

            {version.text && (
              <p className="text-sm leading-relaxed whitespace-pre-line">{version.text}</p>
            )}

            {version.link && (
              <a
                href={version.link}
                target="_blank"
                rel="noreferrer"
                className="flex max-w-full items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
              >
                <ExternalLink className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="truncate">{version.link}</span>
              </a>
            )}

            {version.files.length > 0 && (
              <ul className="grid gap-2 sm:grid-cols-2">
                {version.files.map((file) => (
                  <li key={file.id}>
                    <FileLink file={file} href={`/api/files/${file.id}`} />
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ol>
  );
}
