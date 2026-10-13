"use client";

import { Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type AIAssistantLauncherProps = {
  onClick: () => void;
};

export function AIAssistantLauncher({ onClick }: AIAssistantLauncherProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            aria-label="Open AI Assistant"
            className="fixed bottom-24 right-6 z-50 flex size-13 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-panel transition-all duration-200 hover:bg-primary/90 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-95 md:bottom-6"
          >
            <Sparkles className="size-6" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">AI Assistant</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
