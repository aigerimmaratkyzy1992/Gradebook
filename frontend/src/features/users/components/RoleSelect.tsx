import type { ComponentProps } from "react";

import { NativeSelect } from "@/components/ui/NativeSelect";
import { ROLE_LABELS } from "@/constants/labels";

import { ROLE_OPTIONS } from "../constants";

type RoleSelectProps = Omit<ComponentProps<typeof NativeSelect>, "children">;

export function RoleSelect(props: RoleSelectProps) {
  return (
    <NativeSelect name="role" {...props}>
      {ROLE_OPTIONS.map((role) => (
        <option key={role} value={role}>
          {ROLE_LABELS[role]}
        </option>
      ))}
    </NativeSelect>
  );
}
