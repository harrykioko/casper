/**
 * AI Workspace Canvas - v1 Scaffolding
 * Center column with chat interface and mode tabs.
 */

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { AIMessage, AICanvasMode } from "../types";

interface AICanvasProps {
  messages: AIMessage[];
  onSendMessage: (content: string) => void;
  activeMode: AICanvasMode;
  onModeChange: (mode: AICanvasMode) => void;
  isLoading?: boolean;
}

const smartStarters = [
  { label: "Summarize thread", prompt: "Please summarize this email thread and highlight the key points." },
  { label: "Extract action items", prompt: "Extract all action items from this conversation and list them clearly." },
  { label: "Draft a reply", prompt: "Help me draft a professional reply to this email." },
];

function MessageBubble({ message }: { message: AIMessage }) {
  const isUser = message.role === "user";
  
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[85%] rounded-2xl px-4 py-3",
        isUser 
          ? "bg-primary text-primary-foreground rounded-br-md" 
          : "bg-white/60 dark:bg-white/[0.08] border border-white/20 dark:border-white/[0.06] rounded-bl-md"
      )}>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        <p className={cn(
          "text-[10px] mt-2",
          isUser ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {format(new Date(message.createdAt), "h:mm a")}
        </p>
      </div>
    </div>
  );
}

export function AICanvas({ 
  messages, 
  onSendMessage, 
  activeMode, 
  onModeChange,
  isLoading 
}: AICanvasProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleStarterClick = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Mode Tabs */}
      <div className="px-4 py-3 border-b border-white/10">
        <Tabs value={activeMode} onValueChange={(v) => onModeChange(v as AICanvasMode)}>
          <TabsList className="bg-white/30 dark:bg-white/[0.06]">
            <TabsTrigger value="ask" className="text-xs">Ask</TabsTrigger>
            <TabsTrigger value="draft" className="text-xs">Draft</TabsTrigger>
            <TabsTrigger value="plan" className="text-xs">Plan</TabsTrigger>
            <TabsTrigger value="summarize" className="text-xs">Summarize</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-sm font-medium text-foreground">Start a conversation</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
              Ask questions, draft responses, or get help with tasks based on your context.
            </p>
          </div>
        ) : (
          <>
            {messages.map(message => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/60 dark:bg-white/[0.08] border border-white/20 dark:border-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse delay-75" />
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse delay-150" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 space-y-3">
        {/* Smart Starters */}
        <div className="flex flex-wrap gap-2">
          {smartStarters.map(starter => (
            <button
              key={starter.label}
              onClick={() => handleStarterClick(starter.prompt)}
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-white/40 dark:bg-white/[0.06] border border-white/20 dark:border-white/[0.08] text-foreground hover:bg-white/60 dark:hover:bg-white/[0.1] transition-colors"
            >
              {starter.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[44px] max-h-[120px] resize-none bg-white/50 dark:bg-white/[0.04] border-white/20 dark:border-white/[0.08]"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="h-11 w-11 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
