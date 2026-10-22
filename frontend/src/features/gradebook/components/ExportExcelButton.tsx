import { FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { download, getErrorMessage } from "@/lib/api";

interface IExportExcelButtonProps {
  courseId: string | undefined;
  courseName: string;
}

export function ExportExcelButton({ courseId, courseName }: IExportExcelButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      await download(`/api/courses/${courseId}/gradebook.xlsx`, `Журнал — ${courseName}.xlsx`);
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button variant="outline" onClick={() => void handleExport()} isLoading={isExporting}>
      {!isExporting && <FileSpreadsheet aria-hidden />}
      Скачать Excel
    </Button>
  );
}
