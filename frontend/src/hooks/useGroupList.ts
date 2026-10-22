import type { IGroup } from "@/types";

import { useApiResource, type IApiResource } from "./useApiResource";

const NO_GROUPS: IGroup[] = [];

/**
 * Топтар тізімі: admin барлығын, преподаватель тек өзінікін алады — сүзгіні
 * backend жасайды. Топтар беті де, таңдау өрістері де осы бір көзден оқиды.
 */
export function useGroupList(shouldFetch = true): IApiResource<IGroup[]> {
  return useApiResource(shouldFetch ? "/api/groups" : null, NO_GROUPS);
}
