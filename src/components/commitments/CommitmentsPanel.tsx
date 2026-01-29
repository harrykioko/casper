/**
 * CommitmentsPanel Component
 *
 * Dashboard panel showing commitments with quick actions.
 */

import { useState, useMemo } from "react";
import { Plus, Handshake, ChevronRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CommitmentList, CommitmentStats } from "./CommitmentList";
import { CommitmentModal } from "./CommitmentModal";
import { useCommitments } from "@/hooks/useCommitments";
import { usePeople } from "@/hooks/usePeople";
import type { Commitment, CommitmentInsert } from "@/types/commitment";
import { parseISO, isPast, isToday } from "date-fns";

interface CommitmentsPanelProps {
  maxItems?: number;
  showHeader?: boolean;
  showStats?: boolean;
  onViewAll?: () => void;
  companyId?: string;
  companyType?: "portfolio" | "pipeline";
  personId?: string;
  className?: string;
}

export function CommitmentsPanel({
  maxItems = 5,
  showHeader = true,
  showStats = true,
  onViewAll,
  companyId,
  companyType,
  personId,
  className,
}: CommitmentsPanelProps) {
  const {
    commitments,
    loading,
    createCommitment,
    completeCommitment,
    snoozeCommitment,
    delegateCommitment,
    cancelCommitment,
  } = useCommitments({
    status: "open",
    companyId,
    companyType,
    personId,
  });

  const { people } = usePeople();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "complete" | "snooze" | "delegate">("create");
  const [selectedCommitment, setSelectedCommitment] = useState<Commitment | undefined>();

  // Get overdue count for badge
  const overdueCount = useMemo(() => {
    return commitments.filter(c =>
      c.dueAt && isPast(parseISO(c.dueAt)) && !isToday(parseISO(c.dueAt))
    ).length;
  }, [commitments]);

  const handleCreate = () => {
    setSelectedCommitment(undefined);
    setModalMode("create");
    setModalOpen(true);
  };

  const handleComplete = (id: string) => {
    const commitment = commitments.find(c => c.id === id);
    setSelectedCommitment(commitment);
    setModalMode("complete");
    setModalOpen(true);
  };

  const handleSnooze = (id: string) => {
    const commitment = commitments.find(c => c.id === id);
    setSelectedCommitment(commitment);
    setModalMode("snooze");
    setModalOpen(true);
  };

  const handleDelegate = (id: string) => {
    const commitment = commitments.find(c => c.id === id);
    setSelectedCommitment(commitment);
    setModalMode("delegate");
    setModalOpen(true);
  };

  const handleSave = async (data: CommitmentInsert) => {
    await createCommitment(data);
  };

  const handleCompleteSubmit = async (id: string, completedVia?: string, notes?: string) => {
    await completeCommitment(id, completedVia, notes);
  };

  const handleSnoozeSubmit = async (id: string, until: Date) => {
    await snoozeCommitment(id, until);
  };

  const handleDelegateSubmit = async (id: string, toPersonId: string, toPersonName: string) => {
    await delegateCommitment(id, toPersonId, toPersonName);
  };

  // Map people for dropdowns
  const peopleOptions = people.map(p => ({ id: p.id, name: p.name }));

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        {showHeader && (
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Handshake className="h-5 w-5" />
                  Commitments
                </CardTitle>
                {overdueCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {overdueCount} overdue
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCreate}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
                {onViewAll && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onViewAll}
                  >
                    View all
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
            {showStats && commitments.length > 0 && (
              <CardDescription className="mt-2">
                <CommitmentStats commitments={commitments} />
              </CardDescription>
            )}
          </CardHeader>
        )}
        <CardContent>
          <CommitmentList
            commitments={commitments}
            maxItems={maxItems}
            groupBy="urgency"
            compact
            onComplete={handleComplete}
            onSnooze={handleSnooze}
            onDelegate={handleDelegate}
            onCancel={cancelCommitment}
            emptyMessage="No open commitments"
          />
        </CardContent>
      </Card>

      <CommitmentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        commitment={selectedCommitment}
        mode={modalMode}
        onSave={handleSave}
        onComplete={handleCompleteSubmit}
        onSnooze={handleSnoozeSubmit}
        onDelegate={handleDelegateSubmit}
        people={peopleOptions}
      />
    </>
  );
}

/**
 * Compact commitment widget for sidebar or small spaces
 */
interface CommitmentWidgetProps {
  className?: string;
}

export function CommitmentWidget({ className }: CommitmentWidgetProps) {
  const { commitments, loading, getOverdueCommitments } = useCommitments({ status: "open" });

  const overdueCommitments = getOverdueCommitments();
  const urgentCount = overdueCommitments.length;

  if (loading) {
    return (
      <div className={cn("animate-pulse h-12 bg-muted rounded", className)} />
    );
  }

  if (commitments.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border",
        urgentCount > 0 ? "border-red-500/50 bg-red-500/5" : "border-muted/30 bg-muted/20",
        className
      )}
    >
      <Handshake className={cn(
        "h-5 w-5",
        urgentCount > 0 ? "text-red-500" : "text-muted-foreground"
      )} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {commitments.length} open commitment{commitments.length !== 1 ? "s" : ""}
        </p>
        {urgentCount > 0 && (
          <p className="text-xs text-red-500">
            {urgentCount} overdue
          </p>
        )}
      </div>
      {urgentCount > 0 && (
        <Badge variant="destructive" className="text-xs">
          {urgentCount}
        </Badge>
      )}
    </div>
  );
}
