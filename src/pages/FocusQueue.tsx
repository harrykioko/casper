import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Crosshair, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsDesktop } from "@/hooks/use-mobile";
import { useWorkQueue, type WorkItemStatus, type WorkItemSourceType, type WorkQueueItem } from "@/hooks/useWorkQueue";
import { useWorkItemActions } from "@/hooks/useWorkItemActions";
import { useWorkItemDetail } from "@/hooks/useWorkItemDetail";
import { FocusFiltersPanel } from "@/components/focus/FocusFiltersPanel";
import { WorkQueueList } from "@/components/focus/WorkQueueList";
import { WorkItemReviewCard } from "@/components/focus/WorkItemReviewCard";
import { WorkItemContextRail } from "@/components/focus/WorkItemContextRail";
import { cn } from "@/lib/utils";

export default function FocusQueue() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<WorkItemStatus | 'all'>('all');
  const [reasonFilter, setReasonFilter] = useState<string[]>([]);
  const [sourceTypeFilter, setSourceTypeFilter] = useState<WorkItemSourceType[]>([]);

  // Selected item
  const [selectedItem, setSelectedItem] = useState<WorkQueueItem | null>(null);

  // Data
  const { items, isLoading, counts, isSystemClear, refetch } = useWorkQueue({
    status: statusFilter === 'all' ? undefined : statusFilter,
    reason_codes: reasonFilter.length > 0 ? reasonFilter : undefined,
    source_types: sourceTypeFilter.length > 0 ? sourceTypeFilter : undefined,
  });

  const { data: itemDetail, isLoading: isDetailLoading } = useWorkItemDetail(selectedItem);

  const actions = useWorkItemActions();

  // Find related items (same entity links)
  const relatedItems = useMemo(() => {
    if (!selectedItem || !itemDetail?.entityLinks.length) return [];
    const linkedTargets = new Set(itemDetail.entityLinks.map(l => `${l.target_type}:${l.target_id}`));
    return items.filter(
      item => item.id !== selectedItem.id && item.primary_link &&
        linkedTargets.has(`${item.primary_link.target_type}:${item.primary_link.target_id}`)
    );
  }, [selectedItem, itemDetail, items]);

  const handleSelect = (item: WorkQueueItem) => {
    setSelectedItem(item);
  };

  const handleClose = () => {
    setSelectedItem(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Crosshair className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Focus Queue</h1>
                <p className="text-sm text-muted-foreground">
                  {counts.needsReview} to review
                  {counts.snoozed > 0 && ` · ${counts.snoozed} snoozed`}
                  {isSystemClear && " · All clear"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content - 3 column layout */}
      <div className="max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-6 py-6">
        <div className={cn(
          "grid gap-6",
          isDesktop && selectedItem
            ? "grid-cols-[240px_minmax(0,1fr)_300px]"
            : isDesktop
              ? "grid-cols-[240px_1fr]"
              : "grid-cols-1"
        )}>
          {/* Left: Filters Panel (desktop only) */}
          {isDesktop && (
            <FocusFiltersPanel
              counts={counts}
              isSystemClear={isSystemClear}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              reasonFilter={reasonFilter}
              onReasonFilterChange={setReasonFilter}
              sourceTypeFilter={sourceTypeFilter}
              onSourceTypeFilterChange={setSourceTypeFilter}
            />
          )}

          {/* Center: Queue list or Review Card */}
          <div className={cn(
            isDesktop && "lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:pr-2"
          )}>
            {selectedItem && !isDesktop ? (
              <WorkItemReviewCard
                detail={itemDetail || null}
                isLoading={isDetailLoading}
                onLinkEntity={(targetType, targetId) => {
                  if (!selectedItem) return;
                  actions.linkEntity({
                    workItemId: selectedItem.id,
                    sourceType: selectedItem.source_type,
                    sourceId: selectedItem.source_id,
                    targetType,
                    targetId,
                  });
                }}
                onCreateTask={(task) => {
                  if (!selectedItem) return;
                  actions.createTaskFromSuggestion({
                    workItemId: selectedItem.id,
                    sourceType: selectedItem.source_type,
                    sourceId: selectedItem.source_id,
                    taskContent: task.content,
                    taskPriority: task.priority,
                  });
                }}
                onSaveAsNote={(content, title) => {
                  if (!selectedItem) return;
                  actions.saveAsNote({
                    workItemId: selectedItem.id,
                    content,
                    title,
                  });
                }}
                onSnooze={(until) => {
                  if (!selectedItem) return;
                  actions.snooze(selectedItem.id, until);
                  setSelectedItem(null);
                }}
                onNoAction={() => {
                  if (!selectedItem) return;
                  actions.noAction(selectedItem.id);
                  setSelectedItem(null);
                }}
                onMarkTrusted={() => {
                  if (!selectedItem) return;
                  actions.markTrusted(selectedItem.id);
                  setSelectedItem(null);
                }}
                onClose={handleClose}
              />
            ) : (
              <>
                <WorkQueueList
                  items={items}
                  selectedId={selectedItem?.id || null}
                  onSelect={handleSelect}
                  isLoading={isLoading}
                  isSystemClear={isSystemClear}
                />
                {/* Desktop: Review card appears in the center when item selected */}
                {isDesktop && selectedItem && (
                  <div className="mt-4">
                    <WorkItemReviewCard
                      detail={itemDetail || null}
                      isLoading={isDetailLoading}
                      onLinkEntity={(targetType, targetId) => {
                        actions.linkEntity({
                          workItemId: selectedItem.id,
                          sourceType: selectedItem.source_type,
                          sourceId: selectedItem.source_id,
                          targetType,
                          targetId,
                        });
                      }}
                      onCreateTask={(task) => {
                        actions.createTaskFromSuggestion({
                          workItemId: selectedItem.id,
                          sourceType: selectedItem.source_type,
                          sourceId: selectedItem.source_id,
                          taskContent: task.content,
                          taskPriority: task.priority,
                        });
                      }}
                      onSaveAsNote={(content, title) => {
                        actions.saveAsNote({
                          workItemId: selectedItem.id,
                          content,
                          title,
                        });
                      }}
                      onSnooze={(until) => {
                        actions.snooze(selectedItem.id, until);
                        setSelectedItem(null);
                      }}
                      onNoAction={() => {
                        actions.noAction(selectedItem.id);
                        setSelectedItem(null);
                      }}
                      onMarkTrusted={() => {
                        actions.markTrusted(selectedItem.id);
                        setSelectedItem(null);
                      }}
                      onClose={handleClose}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: Context Rail (desktop only, when item selected) */}
          {isDesktop && selectedItem && (
            <WorkItemContextRail
              workItem={selectedItem}
              entityLinks={itemDetail?.entityLinks || []}
              extracts={itemDetail?.extracts || []}
              relatedItems={relatedItems}
              isLoading={isDetailLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
