import { DropdownMenu as Primitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const DropdownMenu = Primitive.Root;
export const DropdownMenuTrigger = Primitive.Trigger;
export const DropdownMenuGroup = Primitive.Group;

export function DropdownMenuContent({
  className,
  sideOffset = 8,
  align = "end",
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(
          "z-50 min-w-48 origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg shadow-black/5",
          "transition-[opacity,scale] duration-150 ease-out starting:scale-95 starting:opacity-0",
          className,
        )}
        {...props}
      />
    </Primitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  isDestructive = false,
  ...props
}: ComponentProps<typeof Primitive.Item> & { isDestructive?: boolean }) {
  return (
    <Primitive.Item
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
        isDestructive && "text-destructive [&_svg]:text-destructive",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof Primitive.Label>) {
  return <Primitive.Label className={cn("px-2.5 py-2 text-sm", className)} {...props} />;
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof Primitive.Separator>) {
  return <Primitive.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}

export const DropdownMenuRadioGroup = Primitive.RadioGroup;

export function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: ComponentProps<typeof Primitive.RadioItem>) {
  return (
    <Primitive.RadioItem
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-md py-2 pr-8 pl-2.5 text-sm outline-none select-none data-[highlighted]:bg-accent [&_svg]:size-4 [&_svg]:text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
      <Primitive.ItemIndicator className="absolute right-2.5 size-1.5 rounded-full bg-foreground" />
    </Primitive.RadioItem>
  );
}
