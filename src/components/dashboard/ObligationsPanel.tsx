/**
 * ObligationsPanel - Dashboard widget showing at-risk obligations
 */

import { useNavigate } from "react-router-dom";
import { Handshake, AlertTriangle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useObligations } from "@/hooks/useObligations";
import { isPast, isToday, parseISO, differenceInDays } from "date-fns";
import {
  ActionPanel,
  ActionPanelHeader,
  ActionPanelListArea,
  ActionPanelFooter,
} from "@/components/ui/action-panel";
import type { Commitment } from "@/types/commitment";

export function ObligationsPanel() {
  const navigate = useNavigate();
  const { obligations, isLoading } = useObligations({
    direction: "all",
    status: "all",
  });

  // Filter to at-risk obligations
  const atRiskObligations = obligations.filter((c) => {
    // Overdue owed_by_me
    if (c.direction === "owed_by_me" && c.dueAt && isPast(parseISO(c.dueAt)) && !isToday(parseISO(c.dueAt))) {
      return true;
    }
    // Stale waiting_on (expected_by passed)
    if (c.status === "waiting_on" && c.expectedBy && isPast(parseISO(c.expectedBy))) {
      return true;
    }
    // High urgency
    if (c.impliedUrgency === "asap" || c.impliedUrgency === "today") {
      return true;
    }
    // Due today
    if (c.dueAt && isToday(parseISO(c.dueAt))) {
      return true;
    }
    return false;
  });

  if (isLoading || atRiskObligations.length === 0) {
    return null;
  }

  return (
    <ActionPanel accentColor="rose" className="h-full">
      <ActionPanelHeader
        icon={<Handshake className="h-4 w-4" />}
        title="At Risk"
        subtitle={`${atRiskObligations.length} need attention`}
        badge={
          <Badge variant="destructive" className="text-[10px] px-1.5">
            <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
            {atRiskObligations.length}
          </Badge>
        }
        accentColor="rose"
      />

      <ActionPanelListArea accentColor="rose" className="overflow-y-auto max-h-[240px]">
        <div className="space-y-1.5">
          {atRiskObligations.slice(0, 5).map((obligation) => (
            <ObligationRow
              key={obligation.id}
              obligation={obligation}
              onClick={() => navigate("/obligations")}
            />
          ))}
        </div>
      </ActionPanelListArea>

      <ActionPanelFooter className="justify-end">
        <button
          onClick={() => navigate("/obligations")}
          className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          View all obligations
          <ArrowRight className="h-3 w-3" />
        </button>
      </ActionPanelFooter>
    </ActionPanel>
  );
}

function ObligationRow({
  obligation,
  onClick,
}: {
  obligation: Commitment;
  onClick: () => void;
}) {
  const isOverdue =
    obligation.dueAt &&
    isPast(parseISO(obligation.dueAt)) &&
    !isToday(parseISO(obligation.dueAt));

  const daysOverdue = isOverdue
    ? Math.abs(differenceInDays(new Date(), parseISO(obligation.dueAt!)))
    : 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-muted/40 transition-all"
    >
      <div
        className={`w-1.5 h-8 rounded-full flex-shrink-0 ${
          obligation.direction === "owed_by_me"
            ? "bg-amber-400"
            : "bg-blue-400"
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate font-medium">
          {obligation.title || obligation.content}
        </p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {obligation.personName && <span>{obligation.personName}</span>}
          {isOverdue && (
            <Badge
              variant="destructive"
              className="text-[9px] px-1 py-0"
            >
              {daysOverdue}d overdue
            </Badge>
          )}
          {obligation.status === "waiting_on" && (
            <Badge
              variant="outline"
              className="text-[9px] px-1 py-0 text-cyan-400 border-cyan-400/30"
            >
              waiting
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
