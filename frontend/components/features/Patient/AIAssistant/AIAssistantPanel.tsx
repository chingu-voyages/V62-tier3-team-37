"use client";

import { Bot, Send, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SUGGESTED_PROMPTS = [
  "What specialists are available?",
  "How do I book an appointment?",
  "What insurance plans do you accept?",
  "Help me find a doctor near me",
];

type AIAssistantPanelProps = {
  onClose: () => void;
};

export function AIAssistantPanel({ onClose }: AIAssistantPanelProps) {
  const [input, setInput] = useState("");

  return (
    <aside
      aria-label="AI Assistant"
      className="fixed bottom-0 right-0 z-40 flex h-[calc(100vh-4rem)] w-full max-w-sm flex-col bg-card shadow-panel ring-1 ring-border/50 md:top-0 md:h-dvh"
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-border/50 px-5 py-4">
        <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
          <Bot className="size-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="type-label text-foreground font-medium">AI Assistant</h2>
          <p className="type-helper text-muted-foreground">Ask me anything about your health</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close AI Assistant"
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-accent">
          <Sparkles className="size-7 text-primary/60" />
        </div>
        <h3 className="type-h3 text-foreground">How can I help with your health today?</h3>
        <p className="mt-1 type-body text-muted-foreground max-w-xs">
          Ask me about doctors, appointments, or managing your healthcare.
        </p>

        <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setInput(prompt)}
              className="w-full rounded-lg border border-border/60 px-3.5 py-2 type-helper text-muted-foreground text-left transition-colors hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-border/50 px-4 py-3">
        <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Send message">
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </aside>
  );
}
