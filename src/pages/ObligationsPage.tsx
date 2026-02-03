/**
 * ObligationsPage - Dedicated surface for tracking bidirectional obligations
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Handshake,
  Search,
  Plus,
  ArrowRight,
  ArrowLeft as ArrowLeftIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useObligations, type ObligationFilters } from "@/hooks/useObligations";
import { useCommitments } from "@/hooks/useCommitments";
import { CommitmentCard } from "@/components/commitments/CommitmentCard";
import { CommitmentModal } from "@/components/commitments/CommitmentModal";
import type { Commitment, CommitmentDirection, CommitmentStatus, CommitmentInsert } from "@/types/commitment";
import { cn } from "@/lib/utils";

const DIRECTION_TABS: Array<{
  value: CommitmentDirection | "all";
  label: string;
  icon?: typeof ArrowRight;
}> = [
  { value: "all", label: "All" },
  { value: "owed_by_me", label: "I Owe", icon: ArrowRight },
  { value: "owed_to_me", label: "Owed to Me", icon: ArrowLeftIcon },
];

export default function ObligationsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ObligationFilters>({
    direction: "all",
    status: "all",
    search: "",
  });
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCommitment, setSelectedCommitment] = useState<Commitment | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "view" | "complete" | "snooze" | "delegate">("create");

  const { obligations, counts, isLoading, refetch } = useObligations(filters);
  const {
    completeCommitment,
    snoozeCommitment,
    delegateCommitment,
    cancelCommitment,
    createCommitment,
  } = useCommitments();

  const handleComplete = (id: string) => {
    const c = obligations.find((o) => o.id === id);
    if (c) {
      setSelectedCommitment(c);
      setModalMode("complete");
    }
  };

  const handleSnooze = (id: string) => {
    const c = obligations.find((o) => o.id === id);
    if (c) {
      setSelectedCommitment(c);
      setModalMode("snooze");
    }
  };

  const handleDelegate = (id: string) => {
    const c = obligations.find((o) => o.id === id);
    if (c) {
      setSelectedCommitment(c);
      setModalMode("delegate");
    }
  };

  const handleView = (commitment: Commitment) => {
    setSelectedCommitment(commitment);
    setModalMode("view");
  };

  const handleSave = async (data: CommitmentInsert) => {
    await createCommitment(data);
    await refetch();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-[1200px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
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
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <Handshake className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">
                    Obligations
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {counts.total} active &middot; {counts.owedByMe} I owe &middot;{" "}
                    {counts.owedToMe} owed to me
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => {
                setModalMode("create");
                setShowCreate(true);
              }}
              className="bg-gradient-to-r from-[#FF6A79] to-[#415AFF] text-white hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              New Obligation
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-[1200px] mx-auto px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Direction tabs */}
          <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
            {DIRECTION_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, direction: tab.value }))
                }
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  filters.direction === tab.value
                    ? "bg-background shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status dropdown */}
          <Select
            value={filters.status || "all"}
            onValueChange={(v) =>
              setFilters((prev) => ({
                ...prev,
                status: v as CommitmentStatus | "all",
              }))
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="waiting_on">Waiting On</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="broken">Broken</SelectItem>
              <SelectItem value="delegated">Delegated</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-[400px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search obligations..."
              value={filters.search || ""}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Obligations list */}
      <div className="max-w-[1200px] mx-auto px-6 pb-8">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-muted/20 animate-pulse"
              />
            ))}
          </div>
        ) : obligations.length === 0 ? (
          <div className="text-center py-16">
            <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No obligations found
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Track your commitments and promises here.
            </p>
            <Button
              onClick={() => {
                setModalMode("create");
                setShowCreate(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add your first obligation
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {obligations.map((obligation) => (
              <CommitmentCard
                key={obligation.id}
                commitment={obligation}
                onComplete={handleComplete}
                onSnooze={handleSnooze}
                onDelegate={handleDelegate}
                onCancel={(id) => cancelCommitment(id)}
                onClick={handleView}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <CommitmentModal
          open={showCreate}
          onOpenChange={setShowCreate}
          mode="create"
          onSave={handleSave}
        />
      )}

      {/* View/action modal */}
      {selectedCommitment && (
        <CommitmentModal
          open={!!selectedCommitment}
          onOpenChange={(open) => {
            if (!open) setSelectedCommitment(null);
          }}
          mode={modalMode}
          commitment={selectedCommitment}
          onComplete={async (id, via, notes) => {
            await completeCommitment(id, via, notes);
            await refetch();
            setSelectedCommitment(null);
          }}
          onSnooze={async (id, until) => {
            await snoozeCommitment(id, until);
            await refetch();
            setSelectedCommitment(null);
          }}
          onDelegate={async (id, personId, name) => {
            await delegateCommitment(id, personId, name);
            await refetch();
            setSelectedCommitment(null);
          }}
        />
      )}
    </div>
  );
}
