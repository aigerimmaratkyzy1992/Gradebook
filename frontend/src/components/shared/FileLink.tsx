import { Download, LoaderCircle, Paperclip } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { download, getErrorMessage } from "@/lib/api";
import { cn, formatSize } from "@/lib/utils";
import type { IFileMeta } from "@/types";

interface IFileLinkProps {
  file: IFileMeta;
  /** Жүктеу эндпоинты, мыс. `/api/files/12`. */
  href: string;
  className?: string;
}

/** Қорғалған файлды жүктейтін жол: қате болса — toast, жүктеу кезінде — спиннер. */
export function FileLink({ file, href, className }: IFileLinkProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleClick() {
    setIsDownloading(true);
    try {
      await download(href, file.filename);
    } catch (caught) {
      toast.error(getErrorMessage(caught), { description: file.filename });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={isDownloading}
      className={cn(
        "group flex w-full min-w-0 items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors duration-150 hover:bg-accent disabled:opacity-70",
        className,
      )}
    >
      <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{file.filename}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{formatSize(file.size)}</span>
      {isDownloading ? (
        <LoaderCircle className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
      ) : (
        <Download
          className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
          aria-hidden
        />
      )}
      <span className="sr-only">Скачать</span>
    </button>
  );
}
