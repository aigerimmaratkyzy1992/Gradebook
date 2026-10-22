import { ROUTES } from "@/constants/routes";

/**
 * RequireAuth логинге жібергенде `state.from`-ға бастапқы жолды жазады.
 * State кез келген нәрсе болуы мүмкін, сондықтан тек ішкі жолды қабылдаймыз.
 */
export function getRedirectPath(state: unknown): string {
  if (typeof state !== "object" || state === null || !("from" in state)) {
    return ROUTES.home;
  }

  const { from } = state;
  const isInternalPath =
    typeof from === "string" && from.startsWith("/") && !from.startsWith("//");
  return isInternalPath ? from : ROUTES.home;
}
