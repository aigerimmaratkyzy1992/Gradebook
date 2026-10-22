import { Award, CalendarClock, ExternalLink, Link2, ListChecks, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Deadline } from "@/components/shared/Deadline";
import { FileLink } from "@/components/shared/FileLink";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { AssignmentDetail } from "@/types";

interface IAssignmentInfoCardProps {
  assignment: Pick<
    AssignmentDetail,
    "description" | "due_at" | "max_score" | "criteria" | "material_url" | "files"
  >;
}

interface IInfoItemProps {
  icon: LucideIcon;
  label: string;
  className?: string;
  children: ReactNode;
}

function InfoItem({ icon: Icon, label, className, children }: IInfoItemProps) {
  return (
    <div className={cn("flex min-w-0 gap-3", className)}>
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium">{children}</dd>
      </div>
    </div>
  );
}

/** Тапсырма шарты. Материалдар мерзім өтсе де қолжетімді — тек белгі көрсетіледі. */
export function AssignmentInfoCard({ assignment }: IAssignmentInfoCardProps) {
  const { description, due_at, max_score, criteria, material_url, files } = assignment;
  const hasFiles = files.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Условие</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {description ? (
          <p className="text-sm leading-relaxed whitespace-pre-line">{description}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Условие не указано</p>
        )}

        <dl className="grid gap-4 sm:grid-cols-2">
          <InfoItem icon={CalendarClock} label="Срок сдачи">
            <Deadline dueAt={due_at} />
          </InfoItem>
          <InfoItem icon={Award} label="Максимальный балл">
            <span className="tabular-nums">{max_score}</span>
          </InfoItem>
          {criteria && (
            <InfoItem icon={ListChecks} label="Критерии" className="sm:col-span-2">
              <span className="font-normal whitespace-pre-line">{criteria}</span>
            </InfoItem>
          )}
          {material_url && (
            <InfoItem icon={Link2} label="Материал" className="sm:col-span-2">
              <a
                href={material_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex max-w-full items-center gap-1.5 underline-offset-4 hover:underline"
              >
                <span className="truncate">{material_url}</span>
                <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              </a>
            </InfoItem>
          )}
        </dl>

        {hasFiles && (
          <section aria-labelledby="assignment-files-title" className="space-y-2">
            <h3 id="assignment-files-title" className="text-xs font-medium text-muted-foreground">
              Файлы задания
            </h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {files.map((file) => (
                <li key={file.id} className="min-w-0">
                  <FileLink file={file} href={`/api/assignments/files/${file.id}`} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
