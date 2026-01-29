/**
 * CommitmentList Component
 *
 * Displays a list of commitments with filtering and grouping options.
 */

import { useMemo, useState } from "react";
import { parseISO, isToday, isPast, differenceInDays } from "date-fns";
import { Handshake, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommitmentCard } from "./CommitmentCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Commitment } from "@/types/commitment";

type GroupBy = "none" | "urgency" | "person" | "company";
type FilterBy = "all" | "overdue" | "today" | "upcoming" | "no-date";

interface CommitmentListProps {
  commitments: Commitment[];
  onComplete?: (id: string) => void;
  onSnooze?: (id: string) => void;
  onDelegate?: (id: string) => void;
  onCancel?: (id: string) => void;
  onClick?: (commitment: Commitment) => void;
  groupBy?: GroupBy;
  filterBy?: FilterBy;
  compact?: boolean;
  showEmptyState?: boolean;
  emptyMessage?: string;
  maxItems?: number;
}

interface GroupedCommitments {
  label: string;
  icon?: React.ReactNode;
  commitments: Commitment[];
  variant?: "destructive" | "warning" | "default";
}

export function CommitmentList({
  commitments,
  onComplete,
  onSnooze,
  onDelegate,
  onCancel,
  onClick,
  groupBy = "none",
  filterBy = "all",
  compact = false,
  showEmptyState = true,
  emptyMessage = "No commitments",
  maxItems,
}: CommitmentListProps) {
  // Filter commitments
  const filteredCommitments = useMemo(() => {
    let filtered = commitments;

    switch (filterBy) {
      case "overdue":
        filtered = commitments.filter(c =>
          c.dueAt && isPast(parseISO(c.dueAt)) && !isToday(parseISO(c.dueAt))
        );
        break;
      case "today":
        filtered = commitments.filter(c =>
          c.dueAt && isToday(parseISO(c.dueAt))
        );
        break;
      case "upcoming":
        filtered = commitments.filter(c =>
          c.dueAt &&
          !isPast(parseISO(c.dueAt)) &&
          differenceInDays(parseISO(c.dueAt), new Date()) <= 7
        );
        break;
      case "no-date":
        filtered = commitments.filter(c => !c.dueAt);
        break;
    }

    if (maxItems) {
      filtered = filtered.slice(0, maxItems);
    }

    return filtered;
  }, [commitments, filterBy, maxItems]);

  // Group commitments
  const groupedCommitments = useMemo((): GroupedCommitments[] => {
    if (groupBy === "none") {
      return [{ label: "", commitments: filteredCommitments }];
    }

    if (groupBy === "urgency") {
      const overdue: Commitment[] = [];
      const today: Commitment[] = [];
      const thisWeek: Commitment[] = [];
      const later: Commitment[] = [];
      const noDate: Commitment[] = [];

      for (const c of filteredCommitments) {
        if (!c.dueAt) {
          noDate.push(c);
        } else {
          const dueDate = parseISO(c.dueAt);
          if (isPast(dueDate) && !isToday(dueDate)) {
            overdue.push(c);
          } else if (isToday(dueDate)) {
            today.push(c);
          } else if (differenceInDays(dueDate, new Date()) <= 7) {
            thisWeek.push(c);
          } else {
            later.push(c);
          }
        }
      }

      const groups: GroupedCommitments[] = [];
      if (overdue.length > 0) {
        groups.push({
          label: "Overdue",
          icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
          commitments: overdue,
          variant: "destructive",
        });
      }
      if (today.length > 0) {
        groups.push({
          label: "Due Today",
          icon: <Clock className="h-4 w-4 text-orange-500" />,
          commitments: today,
          variant: "warning",
        });
      }
      if (thisWeek.length > 0) {
        groups.push({
          label: "This Week",
          icon: <Clock className="h-4 w-4 text-yellow-500" />,
          commitments: thisWeek,
        });
      }
      if (later.length > 0) {
        groups.push({
          label: "Later",
          icon: <Clock className="h-4 w-4 text-muted-foreground" />,
          commitments: later,
        });
      }
      if (noDate.length > 0) {
        groups.push({
          label: "No Due Date",
          commitments: noDate,
        });
      }

      return groups;
    }

    if (groupBy === "person") {
      const byPerson = new Map<string, Commitment[]>();
      const noPerson: Commitment[] = [];

      for (const c of filteredCommitments) {
        if (c.personName) {
          const existing = byPerson.get(c.personName) || [];
          existing.push(c);
          byPerson.set(c.personName, existing);
        } else {
          noPerson.push(c);
        }
      }

      const groups: GroupedCommitments[] = [];
      for (const [person, comms] of byPerson) {
        groups.push({ label: person, commitments: comms });
      }
      if (noPerson.length > 0) {
        groups.push({ label: "No Person", commitments: noPerson });
      }

      return groups;
    }

    if (groupBy === "company") {
      const byCompany = new Map<string, Commitment[]>();
      const noCompany: Commitment[] = [];

      for (const c of filteredCommitments) {
        if (c.companyName) {
          const existing = byCompany.get(c.companyName) || [];
          existing.push(c);
          byCompany.set(c.companyName, existing);
        } else {
          noCompany.push(c);
        }
      }

      const groups: GroupedCommitments[] = [];
      for (const [company, comms] of byCompany) {
        groups.push({ label: company, commitments: comms });
      }
      if (noCompany.length > 0) {
        groups.push({ label: "General", commitments: noCompany });
      }

      return groups;
    }

    return [{ label: "", commitments: filteredCommitments }];
  }, [filteredCommitments, groupBy]);

  if (filteredCommitments.length === 0 && showEmptyState) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Handshake className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedCommitments.map((group, groupIndex) => (
        <div key={group.label || groupIndex}>
          {group.label && (
            <div className="flex items-center gap-2 mb-3">
              {group.icon}
              <h3 className={cn(
                "text-sm font-medium",
                group.variant === "destructive" && "text-red-500",
                group.variant === "warning" && "text-orange-500"
              )}>
                {group.label}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {group.commitments.length}
              </Badge>
            </div>
          )}
          <div className="space-y-2">
            {group.commitments.map((commitment) => (
              <CommitmentCard
                key={commitment.id}
                commitment={commitment}
                onComplete={onComplete}
                onSnooze={onSnooze}
                onDelegate={onDelegate}
                onCancel={onCancel}
                onClick={onClick}
                compact={compact}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Commitment stats display
 */
interface CommitmentStatsProps {
  commitments: Commitment[];
}

export function CommitmentStats({ commitments }: CommitmentStatsProps) {
  const stats = useMemo(() => {
    let overdue = 0;
    let dueToday = 0;
    let dueSoon = 0;
    let total = commitments.length;

    for (const c of commitments) {
      if (c.dueAt) {
        const dueDate = parseISO(c.dueAt);
        if (isPast(dueDate) && !isToday(dueDate)) {
          overdue++;
        } else if (isToday(dueDate)) {
          dueToday++;
        } else if (differenceInDays(dueDate, new Date()) <= 3) {
          dueSoon++;
        }
      }
    }

    return { overdue, dueToday, dueSoon, total };
  }, [commitments]);

  return (
    <div className="flex items-center gap-4 text-sm">
      {stats.overdue > 0 && (
        <div className="flex items-center gap-1 text-red-500">
          <AlertTriangle className="h-4 w-4" />
          <span>{stats.overdue} overdue</span>
        </div>
      )}
      {stats.dueToday > 0 && (
        <div className="flex items-center gap-1 text-orange-500">
          <Clock className="h-4 w-4" />
          <span>{stats.dueToday} due today</span>
        </div>
      )}
      {stats.dueSoon > 0 && (
        <div className="flex items-center gap-1 text-yellow-500">
          <Clock className="h-4 w-4" />
          <span>{stats.dueSoon} due soon</span>
        </div>
      )}
      <div className="flex items-center gap-1 text-muted-foreground">
        <Handshake className="h-4 w-4" />
        <span>{stats.total} total</span>
      </div>
    </div>
  );
}
