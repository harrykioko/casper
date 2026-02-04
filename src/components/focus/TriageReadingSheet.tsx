import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  ExternalLink,
  ListPlus,
  ArrowUpRight,
  Radio,
  Archive,
  Clock,
  ChevronDown,
  Folder,
  StickyNote,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { addHours, addDays, startOfTomorrow, nextMonday } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useTriageReadingActions } from "@/hooks/useTriageReadingActions";
import { useReadingEnrichment } from "@/hooks/useReadingEnrichment";
import { useProjects } from "@/hooks/useProjects";
import { ReadingItemNotesSection } from "@/components/notes/ReadingItemNotesSection";
import { cn } from "@/lib/utils";
import type { TriageQueueItem } from "@/hooks/useTriageQueue";
import type { ContentType, ReadingPriority, ReadLaterBucket } from "@/types/readingItem";

interface TriageReadingSheetProps {
  open: boolean;
  onClose: () => void;
  item: TriageQueueItem | null;
  onAdvance: () => void;
  onSnooze: (until: Date) => void;
}

const CONTENT_TYPE_OPTIONS: { value: ContentType; label: string; color: string }[] = [
  { value: "article", label: "Article", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "x_post", label: "X Post", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { value: "blog_post", label: "Blog", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "newsletter", label: "Newsletter", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "tool", label: "Tool", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
];

const PRIORITY_OPTIONS: { value: ReadingPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
  { value: "normal", label: "Normal", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "high", label: "High", color: "bg-red-500/20 text-red-400 border-red-500/30" },
];

const SNOOZE_OPTIONS = [
  { label: "1 hour", getDate: () => addHours(new Date(), 1) },
  { label: "4 hours", getDate: () => addHours(new Date(), 4) },
  { label: "Tomorrow", getDate: () => startOfTomorrow() },
  { label: "Next week", getDate: () => nextMonday(new Date()) },
  { label: "3 days", getDate: () => addDays(new Date(), 3) },
];

const ACTIONABILITY_STYLES: Record<string, { label: string; color: string }> = {
  diligence: { label: "Diligence", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  follow_up: { label: "Follow-up", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  idea: { label: "Idea", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  none: { label: "Info only", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
};

interface ReadingItemDetail {
  id: string;
  url: string;
  title: string;
  description: string | null;
  hostname: string | null;
  favicon: string | null;
  image: string | null;
  content_type: string | null;
  priority: string;
  read_later_bucket: string | null;
  one_liner: string | null;
  project_id: string | null;
  topics: string[];
  actionability: string | null;
}

export function TriageReadingSheet({
  open,
  onClose,
  item,
  onAdvance,
  onSnooze,
}: TriageReadingSheetProps) {
  const [detail, setDetail] = useState<ReadingItemDetail | null>(null);
  const [enriching, setEnriching] = useState(false);
  const actions = useTriageReadingActions();
  const { enrichItem } = useReadingEnrichment();
  const { projects } = useProjects();

  // Fetch full reading item detail when sheet opens
  useEffect(() => {
    if (!item || item.source_type !== "reading") {
      setDetail(null);
      return;
    }

    supabase
      .from("reading_items")
      .select("id, url, title, description, hostname, favicon, image, content_type, priority, read_later_bucket, one_liner, project_id, topics, actionability")
      .eq("id", item.source_id)
      .single()
      .then(({ data }) => {
        if (data) {
          setDetail(data as ReadingItemDetail);
          // Auto-trigger enrichment if missing
          if (!data.one_liner && !data.topics?.length) {
            setEnriching(true);
            enrichItem(data.id).then(() => {
              // Re-fetch enriched data
              supabase
                .from("reading_items")
                .select("id, url, title, description, hostname, favicon, image, content_type, priority, read_later_bucket, one_liner, project_id, topics, actionability")
                .eq("id", data.id)
                .single()
                .then(({ data: refreshed }) => {
                  if (refreshed) setDetail(refreshed as ReadingItemDetail);
                  setEnriching(false);
                });
            }).catch(() => setEnriching(false));
          }
        }
      });
  }, [item?.source_id]);

  if (!item || !detail) return null;

  const handleAction = (action: () => Promise<void>) => {
    action().then(() => {
      onClose();
      onAdvance();
    });
  };

  const currentContentType = CONTENT_TYPE_OPTIONS.find(o => o.value === detail.content_type);

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        {/* Header with source info */}
        <SheetHeader className="px-6 pt-5 pb-3 border-b border-border">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            {detail.favicon && (
              <img
                src={detail.favicon}
                alt=""
                className="w-4 h-4 rounded flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
            <span className="text-xs truncate">{detail.hostname}</span>
            {currentContentType && (
              <Badge
                variant="outline"
                className={cn("text-[10px] px-1.5 py-0", currentContentType.color)}
              >
                {currentContentType.label}
              </Badge>
            )}
            {item.created_at && (
              <span className="text-xs text-muted-foreground/60 ml-auto">
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </span>
            )}
          </div>
          <SheetTitle className="text-lg font-semibold text-foreground leading-snug">
            {detail.title || "Untitled"}
          </SheetTitle>
          {enriching ? (
            <div className="flex items-center gap-2 mt-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground/50 italic">Analyzing content...</p>
            </div>
          ) : detail.one_liner ? (
            <div className="mt-1 space-y-1.5">
              <p className="text-sm text-muted-foreground">{detail.one_liner}</p>
              {detail.actionability && detail.actionability !== "none" && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0",
                    ACTIONABILITY_STYLES[detail.actionability]?.color
                  )}
                >
                  <Sparkles className="w-2.5 h-2.5 mr-1" />
                  {ACTIONABILITY_STYLES[detail.actionability]?.label}
                </Badge>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/50 mt-1 italic">Needs quick triage</p>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Image preview */}
          {detail.image && (
            <img
              src={detail.image}
              alt=""
              className="w-full h-40 rounded-lg object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}

          {/* Description */}
          {detail.description && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
              {detail.description}
            </p>
          )}

          {/* Topics */}
          {detail.topics && detail.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {detail.topics.map((topic) => (
                <Badge key={topic} variant="secondary" className="text-[10px]">
                  {topic}
                </Badge>
              ))}
            </div>
          )}

          {/* Quick Classification */}
          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Classification
            </p>

            {/* Content Type */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16 flex-shrink-0">Type</span>
              <div className="flex flex-wrap gap-1">
                {CONTENT_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      actions.updateClassification(detail.id, { content_type: opt.value });
                      setDetail(prev => prev ? { ...prev, content_type: opt.value } : prev);
                    }}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors",
                      detail.content_type === opt.value
                        ? opt.color
                        : "bg-muted/30 text-muted-foreground border-transparent hover:border-border"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16 flex-shrink-0">Priority</span>
              <div className="flex gap-1">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      actions.updateClassification(detail.id, { priority: opt.value });
                      setDetail(prev => prev ? { ...prev, priority: opt.value } : prev);
                    }}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors",
                      detail.priority === opt.value
                        ? opt.color
                        : "bg-muted/30 text-muted-foreground border-transparent hover:border-border"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Project */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-16 flex-shrink-0">Project</span>
              <Select
                value={detail.project_id || "none"}
                onValueChange={(val) => {
                  const projectId = val === "none" ? null : val;
                  actions.updateClassification(detail.id, { project_id: projectId });
                  setDetail(prev => prev ? { ...prev, project_id: projectId } : prev);
                }}
              >
                <SelectTrigger className="h-7 text-xs w-48">
                  <SelectValue placeholder="No project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        {project.color && (
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: project.color }}
                          />
                        )}
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* AI Suggestion Pills */}
          {detail.actionability && detail.actionability !== "none" && detail.one_liner && (
            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                AI Suggests
              </p>
              <div className="flex flex-wrap gap-2">
                {detail.actionability === "diligence" && (
                  <button
                    onClick={() => handleAction(() => actions.markUpNext(detail.id, item.id, "today"))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                  >
                    <ArrowUpRight className="w-3 h-3" />
                    Up Next Today — diligence detected
                  </button>
                )}
                {detail.actionability === "follow_up" && (
                  <button
                    onClick={() => handleAction(() => actions.markUpNext(detail.id, item.id))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                  >
                    <ArrowUpRight className="w-3 h-3" />
                    Up Next — follow-up needed
                  </button>
                )}
                {detail.actionability === "idea" && (
                  <button
                    onClick={() => handleAction(() => actions.markSignal(detail.id, item.id))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20"
                  >
                    <Radio className="w-3 h-3" />
                    Keep as Signal — sparks an idea
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Primary Actions */}
          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Triage
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-9 text-xs justify-start gap-2 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30"
                onClick={() => handleAction(() => actions.keepAsQueued(detail.id, item.id))}
              >
                <ListPlus className="h-3.5 w-3.5" />
                Queue
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 text-xs justify-start gap-2 hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/30"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Up Next
                    <ChevronDown className="h-3 w-3 ml-auto" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    onClick={() => handleAction(() => actions.markUpNext(detail.id, item.id))}
                    className="text-xs"
                  >
                    Up Next (no bucket)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleAction(() => actions.markUpNext(detail.id, item.id, "today"))}
                    className="text-xs"
                  >
                    Today
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleAction(() => actions.markUpNext(detail.id, item.id, "this_week"))}
                    className="text-xs"
                  >
                    This Week
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                size="sm"
                variant="outline"
                className="h-9 text-xs justify-start gap-2 hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-500/30"
                onClick={() => handleAction(() => actions.markSignal(detail.id, item.id))}
              >
                <Radio className="h-3.5 w-3.5" />
                Signal
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-9 text-xs justify-start gap-2 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                onClick={() => handleAction(() => actions.archiveFromFocus(detail.id, item.id))}
              >
                <Archive className="h-3.5 w-3.5" />
                Archive
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="pt-2 border-t border-border">
            <ReadingItemNotesSection readingItemId={detail.id} />
          </div>

          {/* Secondary Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-3 text-xs text-muted-foreground"
              onClick={() => window.open(detail.url, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Open Link
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-3 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                >
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  Snooze
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[140px]">
                {SNOOZE_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.label}
                    onClick={() => {
                      onSnooze(option.getDate());
                      onClose();
                      onAdvance();
                    }}
                    className="text-xs"
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
