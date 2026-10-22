import { Toaster as Sonner } from "sonner";

import { useTheme } from "@/providers/ThemeProvider";

export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme}
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: "!rounded-xl !border-border !bg-popover !text-popover-foreground !font-sans",
          description: "!text-muted-foreground",
        },
      }}
    />
  );
}
