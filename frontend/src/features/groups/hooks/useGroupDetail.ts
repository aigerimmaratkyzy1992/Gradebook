import { useApiResource } from "@/hooks/useApiResource";
import type { GroupDetail } from "@/types";

export function useGroupDetail(groupId: string | undefined) {
  const { data, setData, isLoading, error } = useApiResource<GroupDetail | null>(
    groupId ? `/api/groups/${groupId}` : null,
    null,
  );
  return { group: data, setGroup: setData, isLoading, error };
}
