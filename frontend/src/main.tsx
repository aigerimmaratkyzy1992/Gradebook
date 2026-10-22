import { MotionConfig } from "motion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app/App";
import { Toaster } from "@/components/ui/Toaster";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { SessionProvider } from "@/providers/SessionProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Жүйеде «азырақ анимация» қосулы болса, Motion анимацияларды өшіреді. */}
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <SessionProvider>
          <TooltipProvider delayDuration={300}>
            <App />
            <Toaster />
          </TooltipProvider>
        </SessionProvider>
      </ThemeProvider>
    </MotionConfig>
  </StrictMode>,
);
