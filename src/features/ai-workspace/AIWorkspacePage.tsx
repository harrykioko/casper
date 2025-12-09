/**
 * AI Workspace Page - v1 Scaffolding
 * Full-screen glassmorphic 3-column layout.
 * No backend or real AI calls are wired yet.
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ContextRail } from "./components/ContextRail";
import { AICanvas } from "./components/AICanvas";
import { AIOutputPane } from "./components/AIOutputPane";
import { generateAIResponse } from "./aiClient";
import { mockContextItems, mockMessages, mockDrafts } from "./mockData";
import type { AIWorkspaceContextItem, AIMessage, AIDraft, AICanvasMode } from "./types";

export default function AIWorkspacePage() {
  const navigate = useNavigate();
  
  // Local state
  const [contextItems, setContextItems] = useState<AIWorkspaceContextItem[]>(mockContextItems);
  const [messages, setMessages] = useState<AIMessage[]>(mockMessages);
  const [drafts, setDrafts] = useState<AIDraft[]>(mockDrafts);
  const [activeMode, setActiveMode] = useState<AICanvasMode>("ask");
  const [isLoading, setIsLoading] = useState(false);

  // Close handler
  const handleClose = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Esc key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  // Send message handler
  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Generate AI response
    setIsLoading(true);
    try {
      const aiResponse = await generateAIResponse(content, contextItems);
      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  // Draft action handlers (stubbed)
  const handleEditDraft = (id: string) => {
    console.log("Edit draft:", id);
  };

  const handleSendDraft = (id: string) => {
    console.log("Send draft:", id);
  };

  const handleCreateTaskFromDraft = (id: string) => {
    console.log("Create task from draft:", id);
  };

  const handleAddContext = () => {
    console.log("Add context clicked");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background overlay with gradient */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50/80 to-violet-50/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"
        onClick={handleClose}
      />
      
      {/* Main container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "relative w-full max-w-[1600px] h-[calc(100vh-3rem)] sm:h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)]",
          "rounded-[28px] overflow-hidden",
          "bg-white/75 dark:bg-zinc-900/70",
          "backdrop-blur-2xl",
          "border border-white/30 dark:border-white/[0.08]",
          "shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
        )}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/20 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground">AI Workspace</h1>
              <p className="text-xs text-muted-foreground">Context-aware assistant</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-9 w-9 rounded-full hover:bg-white/50 dark:hover:bg-white/[0.08]"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Three-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] xl:grid-cols-[300px_1fr_300px] h-[calc(100%-73px)]">
          {/* Left: Context Rail */}
          <div className="hidden lg:block border-r border-white/10 dark:border-white/[0.06] bg-white/30 dark:bg-white/[0.02]">
            <ContextRail
              contextItems={contextItems}
              onAddContext={handleAddContext}
            />
          </div>

          {/* Center: AI Canvas */}
          <div className="bg-white/20 dark:bg-white/[0.01]">
            <AICanvas
              messages={messages}
              onSendMessage={handleSendMessage}
              activeMode={activeMode}
              onModeChange={setActiveMode}
              isLoading={isLoading}
            />
          </div>

          {/* Right: Output Pane */}
          <div className="hidden lg:block border-l border-white/10 dark:border-white/[0.06] bg-white/30 dark:bg-white/[0.02]">
            <AIOutputPane
              drafts={drafts}
              onEditDraft={handleEditDraft}
              onSendDraft={handleSendDraft}
              onCreateTaskFromDraft={handleCreateTaskFromDraft}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
