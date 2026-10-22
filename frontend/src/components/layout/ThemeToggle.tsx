import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import type { Theme } from "@/constants/theme";
import { useTheme } from "@/providers/ThemeProvider";

const THEME_ITEMS: readonly { value: Theme; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Светлая", icon: Sun },
  { value: "dark", label: "Тёмная", icon: Moon },
  { value: "system", label: "Как в системе", icon: Monitor },
];

function isTheme(value: string): value is Theme {
  return THEME_ITEMS.some((item) => item.value === value);
}

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const TriggerIcon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Тема оформления">
          <TriggerIcon className="size-[18px]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-44">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => isTheme(value) && setTheme(value)}
        >
          {THEME_ITEMS.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
