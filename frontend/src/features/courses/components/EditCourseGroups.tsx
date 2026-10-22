import { Skeleton } from "@/components/ui/Skeleton";
import { useGroupList } from "@/hooks/useGroupList";
import type { GroupBrief } from "@/types";

import { getCourseGroupOptions } from "../utils";

interface IEditCourseGroupsProps {
  /** Қазір тағайындалған топтар — тізімде жоқ болса да белгіленген күйде шығады. */
  selected: GroupBrief[];
}

const FIELD_NAME = "group_ids";

/**
 * Дисциплина топтарын таңдау (FormData-дағы `group_ids`). Ағымдағы топтар
 * тізім жүктелгенше де, жүктелмесе де чекбокс болып тұрады — сақтағанда
 * ешқайсысы байқаусызда ажырамайды.
 */
export function EditCourseGroups({ selected }: IEditCourseGroupsProps) {
  const { data: groups, isLoading, error } = useGroupList();
  const options = getCourseGroupOptions(groups, selected);
  const hasOptions = options.length > 0;

  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-[13px] leading-none font-medium">Группы</legend>

      {hasOptions && (
        <div className="flex flex-wrap gap-2">
          {options.map((group) => (
            <label
              key={group.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm transition-colors duration-150 hover:bg-accent has-checked:border-primary/40 has-checked:bg-accent"
            >
              <input
                type="checkbox"
                name={FIELD_NAME}
                value={group.id}
                defaultChecked={selected.some((item) => item.id === group.id)}
                className="size-4 accent-primary"
              />
              {group.name}
            </label>
          ))}
        </div>
      )}

      {isLoading && <Skeleton className="h-9 w-64" />}

      {error && (
        <p className="text-sm text-muted-foreground">
          Не удалось загрузить список групп — показаны только текущие группы.
        </p>
      )}

      {!isLoading && !error && !hasOptions && (
        <p className="text-sm text-muted-foreground">Групп пока нет</p>
      )}
    </fieldset>
  );
}
