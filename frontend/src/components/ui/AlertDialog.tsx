import { AlertDialog as Primitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

import { buttonVariants } from "./Button";
import { dialogPanelClass, overlayClass } from "./Dialog";

export const AlertDialog = Primitive.Root;
export const AlertDialogTrigger = Primitive.Trigger;

export function AlertDialogContent({
  className,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Overlay className={overlayClass} />
      <Primitive.Content className={cn(dialogPanelClass, "max-w-md", className)} {...props} />
    </Primitive.Portal>
  );
}

export function AlertDialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("grid gap-1.5", className)} {...props} />;
}

export function AlertDialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

export function AlertDialogTitle({ className, ...props }: ComponentProps<typeof Primitive.Title>) {
  return <Primitive.Title className={cn("text-lg font-semibold", className)} {...props} />;
}

export function AlertDialogDescription({
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

export function AlertDialogAction({
  className,
  ...props
}: ComponentProps<typeof Primitive.Action>) {
  return (
    <Primitive.Action
      className={cn(buttonVariants({ variant: "destructive" }), className)}
      {...props}
    />
  );
}

export function AlertDialogCancel({
  className,
  ...props
}: ComponentProps<typeof Primitive.Cancel>) {
  return (
    <Primitive.Cancel className={cn(buttonVariants({ variant: "outline" }), className)} {...props} />
  );
}
