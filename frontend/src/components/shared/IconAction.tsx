import type { ComponentProps } from "react";

import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";

interface IIconActionProps extends Omit<ComponentProps<typeof Button>, "size" | "aria-label"> {
  label: string;
}

/**
 * Тек иконкалы түйме: aria-label мен tooltip бір жерде. Барлық props-ты
 * <Button>-ға жібереді, сондықтан ConfirmAction/DialogTrigger `asChild`
 * арқылы берген ref пен onClick түймеге дейін жетеді.
 */
export function IconAction({ label, variant = "ghost", ...props }: IIconActionProps) {
  return (
    <Tooltip content={label}>
      <Button variant={variant} size="icon-sm" aria-label={label} {...props} />
    </Tooltip>
  );
}
