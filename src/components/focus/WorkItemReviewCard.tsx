import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ExternalLink,
  Link2,
  Clock,
  Ban,
  ShieldCheck,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { format, addHours, addDays, startOfTomorrow, setHours, startOfDay } from "date-fns";
import { TaskSuggestionEditor } from "./TaskSuggestionEditor";
import type { WorkQueueItem } from "@/hooks/useWorkQueue";
import type { WorkItemDetail, EntityLink, ItemExtract } from "@/hooks/useWorkItemDetail";

interface WorkItemReviewCardProps {
  detail: WorkItemDetail | null;
  isLoading: boolean;
  onLinkEntity: (targetType: 'company' | 'project', targetId: string) => void;
  onCreateTask: (task: { content: string; priority: string }) => void;
  onSaveAsNote: (content: string, title?: string) => void;
  onSnooze: (until: Date) => void;
  onNoAction: () => void;
  onMarkTrusted: () => void;
  onClose: () => void;
}

export function WorkItemReviewCard({
  detail,
  isLoading,
  onLinkEntity,
  onCreateTask,
  onSaveAsNote,
  onSnooze,
  onNoAction,
  onMarkTrusted,
  onClose,
}: WorkItemReviewCardProps) {
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["links", "insights", "followups"])
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Select an item to review
      </div>
    );
  }

  const { workItem, sourceRecord, entityLinks, extracts } = detail;

  // Parse extracts
  const summaryExtract = extracts.find(e => e.extract_type === 'summary');
  const highlightsExtract = extracts.find(e => e.extract_type === 'highlights');
  const decisionsExtract = extracts.find(e => e.extract_type === 'decisions');
  const followupsExtract = extracts.find(e => e.extract_type === 'followups');
  const tasksExtract = extracts.find(e => e.extract_type === 'tasks_suggested');

  const oneLiner = (summaryExtract?.content as any)?.one_liner || workItem.one_liner;
  const summary = (summaryExtract?.content as any)?.summary;
  const highlights = (highlightsExtract?.content as any)?.items || [];
  const decisions = (decisionsExtract?.content as any)?.items || [];
  const followups = (followupsExtract?.content as any)?.items || [];
  const suggestedTasks = (tasksExtract?.content as any)?.items || [];

  // Suggested links (ai_match)
  const suggestedLinks = entityLinks.filter(l => l.link_reason === 'ai_match');
  const confirmedLinks = entityLinks.filter(l => l.link_reason !== 'ai_match');

  // Can mark trusted?
  const hasLinks = entityLinks.length > 0;
  const hasExtracts = extracts.length > 0;
  const isIgnored = workItem.status === 'ignored';
  const canTrust = hasLinks || hasExtracts || isIgnored;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const handleSnooze = (duration: 'later_today' | 'tomorrow' | 'next_week') => {
    const now = new Date();
    let until: Date;
    switch (duration) {
      case 'later_today':
        until = addHours(now, 4);
        break;
      case 'tomorrow':
        until = setHours(startOfTomorrow(), 9);
        break;
      case 'next_week':
        until = setHours(addDays(startOfDay(now), 7), 9);
        break;
    }
    onSnooze(until);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-muted/30 backdrop-blur-xl border border-muted/40 rounded-lg overflow-hidden h-full flex flex-col"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-muted/30">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-foreground leading-tight">
              {oneLiner || workItem.source_title || "Review Item"}
            </h2>
            {summary && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{summary}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 text-muted-foreground"
            onClick={onClose}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-[10px]">
            {workItem.source_type.replace('_', ' ')}
          </Badge>
          <span>{format(new Date(workItem.created_at), "MMM d, h:mm a")}</span>
          {workItem.status === 'enriched_pending' && (
            <Badge className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30">
              <Loader2 className="h-2.5 w-2.5 mr-0.5 animate-spin" />
              Enriching...
            </Badge>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Suggested Links */}
        {suggestedLinks.length > 0 && (
          <Section
            title="Suggested Links"
            expanded={expandedSections.has('links')}
            onToggle={() => toggleSection('links')}
          >
            <div className="space-y-2">
              {suggestedLinks.map(link => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/20 border border-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">{link.target_type}: {link.target_id.substring(0, 8)}...</span>
                    {link.confidence && (
                      <div className="w-16 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: `${(link.confidence * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs"
                    onClick={() => onLinkEntity(link.target_type as 'company' | 'project', link.target_id)}
                  >
                    Confirm
                  </Button>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Confirmed Links */}
        {confirmedLinks.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Linked to</p>
            <div className="flex flex-wrap gap-1.5">
              {confirmedLinks.map(link => (
                <Badge key={link.id} variant="secondary" className="text-xs">
                  {link.target_type} · {link.link_reason}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Extracted Insights */}
        {highlights.length > 0 && (
          <Section
            title="Highlights"
            expanded={expandedSections.has('insights')}
            onToggle={() => toggleSection('insights')}
          >
            <ul className="space-y-1">
              {highlights.map((h: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Decisions */}
        {decisions.length > 0 && (
          <Section
            title="Decisions"
            expanded={expandedSections.has('decisions')}
            onToggle={() => toggleSection('decisions')}
          >
            <ul className="space-y-1">
              {decisions.map((d: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-amber-400 mt-0.5">▸</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Follow-ups / Suggested Tasks */}
        {(followups.length > 0 || suggestedTasks.length > 0) && (
          <Section
            title="Follow-ups"
            expanded={expandedSections.has('followups')}
            onToggle={() => toggleSection('followups')}
          >
            {followups.length > 0 && (
              <ul className="space-y-1 mb-3">
                {followups.map((f: string, i: number) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-blue-400 mt-0.5">→</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}
            {suggestedTasks.length > 0 && (
              <TaskSuggestionEditor
                suggestions={suggestedTasks}
                onCreateTask={onCreateTask}
              />
            )}
          </Section>
        )}

        {/* Save as Note */}
        {showNoteEditor && (
          <div className="space-y-2">
            <Textarea
              placeholder="Add note content..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="text-sm min-h-[80px]"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="text-xs"
                disabled={!noteContent.trim()}
                onClick={() => {
                  onSaveAsNote(noteContent);
                  setNoteContent("");
                  setShowNoteEditor(false);
                }}
              >
                Save Note
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs"
                onClick={() => setShowNoteEditor(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Actions bar */}
      <div className="px-5 py-3 border-t border-muted/30 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-8"
          onClick={() => setShowNoteEditor(!showNoteEditor)}
        >
          <Save className="h-3 w-3 mr-1" />
          Save Note
        </Button>
        <div className="flex-1" />
        <Button
          size="sm"
          variant="ghost"
          className="text-xs h-8 text-muted-foreground"
          onClick={() => handleSnooze('tomorrow')}
        >
          <Clock className="h-3 w-3 mr-1" />
          Snooze
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs h-8 text-muted-foreground"
          onClick={onNoAction}
        >
          <Ban className="h-3 w-3 mr-1" />
          No Action
        </Button>
        <Button
          size="sm"
          className={cn(
            "text-xs h-8",
            canTrust
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "opacity-50 cursor-not-allowed"
          )}
          disabled={!canTrust}
          onClick={onMarkTrusted}
          title={!canTrust ? "Link an entity, save extracts, or mark no-action first" : "Mark as trusted"}
        >
          <ShieldCheck className="h-3 w-3 mr-1" />
          Trusted
        </Button>
      </div>
    </motion.div>
  );
}

function Section({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {title}
      </button>
      {expanded && children}
    </div>
  );
}
