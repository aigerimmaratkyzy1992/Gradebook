import { Tabs as Primitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const Tabs = Primitive.Root;

export function TabsList({ className, ...props }: ComponentProps<typeof Primitive.List>) {
  return (
    <Primitive.List
      className={cn(
        "inline-flex h-10 w-fit items-center gap-1 rounded-lg bg-muted p-1 text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof Primitive.Trigger>) {
  return (
    <Primitive.Trigger
      className={cn(
        "inline-flex h-full items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors duration-150 hover:text-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof Primitive.Content>) {
  return <Primitive.Content className={cn("outline-none", className)} {...props} />;
}
