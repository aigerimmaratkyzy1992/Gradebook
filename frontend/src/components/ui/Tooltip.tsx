import { Tooltip as Primitive } from "radix-ui";
import type { ReactNode } from "react";

export const TooltipProvider = Primitive.Provider;

interface ITooltipProps {
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  /** Триггер — бір интерактивті элемент (button, a). */
  children: ReactNode;
}

export function Tooltip({ content, side = "bottom", children }: ITooltipProps) {
  return (
    <Primitive.Root>
      <Primitive.Trigger asChild>{children}</Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          side={side}
          sideOffset={6}
          className="z-50 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition-opacity duration-100 starting:opacity-0"
        >
          {content}
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
