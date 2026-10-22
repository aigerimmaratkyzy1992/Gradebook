import { X } from "lucide-react";
import { Dialog as Primitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogClose = Primitive.Close;

export const overlayClass =
  "fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity duration-150 starting:opacity-0";

export const dialogPanelClass =
  "fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl shadow-black/10 transition-[opacity,scale] duration-150 ease-out starting:scale-[0.97] starting:opacity-0";

export function DialogContent({
  className,
  children,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Overlay className={overlayClass} />
      <Primitive.Content className={cn(dialogPanelClass, className)} {...props}>
        {children}
        <Primitive.Close
          className="absolute top-4 right-4 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Закрыть"
        >
          <X className="size-4" />
        </Primitive.Close>
      </Primitive.Content>
    </Primitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("grid gap-1.5 pr-6", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof Primitive.Title>) {
  return <Primitive.Title className={cn("text-lg font-semibold", className)} {...props} />;
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof Primitive.Description>) {
  return (
    <Primitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}
