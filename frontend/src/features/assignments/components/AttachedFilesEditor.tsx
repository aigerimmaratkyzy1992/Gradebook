import { Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";

import { ConfirmAction } from "@/components/shared/ConfirmAction";
import { FileLink } from "@/components/shared/FileLink";
import { Button } from "@/components/ui/Button";
import { COLLAPSE_MOTION } from "@/constants/motion";
import { api } from "@/lib/api";
import type { IFileMeta } from "@/types";

interface IAttachedFilesEditorProps {
  files: IFileMeta[];
  onChanged: () => Promise<void>;
}

/** Тапсырмаға тіркелген файлдар: жүктеп алу және өшіру (өшіру бірден серверге кетеді). */
export function AttachedFilesEditor({ files, onChanged }: IAttachedFilesEditorProps) {
  if (files.length === 0) return null;

  async function handleDelete(fileId: number) {
    await api(`/api/assignments/files/${fileId}`, { method: "DELETE" });
    toast.success("Файл удалён");
    await onChanged();
  }

  return (
    <div className="grid gap-2">
      <p className="text-[13px] font-medium">Прикреплённые файлы</p>
      <ul className="grid gap-2">
        <AnimatePresence initial={false}>
          {files.map((file) => (
            <motion.li
              key={file.id}
              layout
              {...COLLAPSE_MOTION}
              className="flex items-center gap-2"
            >
              <FileLink
                file={file}
                href={`/api/assignments/files/${file.id}`}
                className="flex-1"
              />
              <ConfirmAction
                title={`Удалить файл «${file.filename}»?`}
                description="Файл сразу удалится из задания."
                onConfirm={() => handleDelete(file.id)}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Удалить файл ${file.filename}`}
                  className="hover:text-destructive"
                >
                  <Trash2 aria-hidden />
                </Button>
              </ConfirmAction>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
