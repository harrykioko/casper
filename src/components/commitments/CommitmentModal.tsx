/**
 * CommitmentModal Component
 *
 * Modal for creating, editing, and viewing commitments.
 */

import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Check,
  Clock,
  Forward,
  X,
  User,
  Building2,
  Calendar,
  AlertTriangle,
  Handshake,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CommitmentForm } from "./CommitmentForm";
import type { Commitment, CommitmentInsert, CommitmentUpdate } from "@/types/commitment";

interface CommitmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commitment?: Commitment;
  mode: "create" | "edit" | "view" | "complete" | "snooze" | "delegate";
  onSave?: (data: CommitmentInsert | CommitmentUpdate) => Promise<void>;
  onComplete?: (id: string, completedVia?: string, notes?: string) => Promise<void>;
  onSnooze?: (id: string, until: Date) => Promise<void>;
  onDelegate?: (id: string, toPersonId: string, toPersonName: string) => Promise<void>;
  people?: Array<{ id: string; name: string }>;
  companies?: Array<{ id: string; name: string; type: "portfolio" | "pipeline" }>;
}

export function CommitmentModal({
  open,
  onOpenChange,
  commitment,
  mode,
  onSave,
  onComplete,
  onSnooze,
  onDelegate,
  people = [],
  companies = [],
}: CommitmentModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (data: CommitmentInsert | CommitmentUpdate) => {
    setIsLoading(true);
    try {
      await onSave?.(data);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "create": return "New Commitment";
      case "edit": return "Edit Commitment";
      case "view": return "Commitment Details";
      case "complete": return "Complete Commitment";
      case "snooze": return "Snooze Commitment";
      case "delegate": return "Delegate Commitment";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5" />
            {getTitle()}
          </DialogTitle>
          {mode === "view" && commitment && (
            <DialogDescription>
              Promised {format(parseISO(commitment.promisedAt), "PPP")}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Create/Edit form */}
        {(mode === "create" || mode === "edit") && (
          <CommitmentForm
            initialValues={commitment}
            onSubmit={handleSave}
            onCancel={() => onOpenChange(false)}
            isEditing={mode === "edit"}
            isLoading={isLoading}
            people={people}
            companies={companies}
          />
        )}

        {/* View mode */}
        {mode === "view" && commitment && (
          <CommitmentViewContent commitment={commitment} />
        )}

        {/* Complete mode */}
        {mode === "complete" && commitment && (
          <CommitmentCompleteForm
            commitment={commitment}
            onComplete={onComplete}
            onCancel={() => onOpenChange(false)}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            onSuccess={() => onOpenChange(false)}
          />
        )}

        {/* Snooze mode */}
        {mode === "snooze" && commitment && (
          <CommitmentSnoozeForm
            commitment={commitment}
            onSnooze={onSnooze}
            onCancel={() => onOpenChange(false)}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            onSuccess={() => onOpenChange(false)}
          />
        )}

        {/* Delegate mode */}
        {mode === "delegate" && commitment && (
          <CommitmentDelegateForm
            commitment={commitment}
            onDelegate={onDelegate}
            onCancel={() => onOpenChange(false)}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            onSuccess={() => onOpenChange(false)}
            people={people}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * View content for a commitment
 */
function CommitmentViewContent({ commitment }: { commitment: Commitment }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="font-medium text-lg">{commitment.content}</p>
        {commitment.context && (
          <p className="text-muted-foreground mt-2">{commitment.context}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        {commitment.personName && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>To: {commitment.personName}</span>
          </div>
        )}
        {commitment.companyName && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{commitment.companyName}</span>
          </div>
        )}
        {commitment.dueAt && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Due: {format(parseISO(commitment.dueAt), "PPP")}</span>
          </div>
        )}
        {commitment.impliedUrgency && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{formatUrgency(commitment.impliedUrgency)}</span>
          </div>
        )}
      </div>

      {commitment.sourceType !== "manual" && (
        <Badge variant="outline">
          From {commitment.sourceType}
        </Badge>
      )}

      {commitment.snoozeCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-orange-500">
          <AlertTriangle className="h-4 w-4" />
          <span>Snoozed {commitment.snoozeCount} times</span>
        </div>
      )}
    </div>
  );
}

/**
 * Form for completing a commitment
 */
function CommitmentCompleteForm({
  commitment,
  onComplete,
  onCancel,
  isLoading,
  setIsLoading,
  onSuccess,
}: {
  commitment: Commitment;
  onComplete?: (id: string, completedVia?: string, notes?: string) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onSuccess: () => void;
}) {
  const [completedVia, setCompletedVia] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onComplete?.(commitment.id, completedVia || undefined, notes || undefined);
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-muted/30 rounded-lg">
        <p className="font-medium">{commitment.content}</p>
        {commitment.personName && (
          <p className="text-sm text-muted-foreground mt-1">
            To: {commitment.personName}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="completedVia">How was it fulfilled?</Label>
        <Input
          id="completedVia"
          placeholder="e.g., Sent email, Called them, Delivered in meeting"
          value={completedVia}
          onChange={(e) => setCompletedVia(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any additional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          <Check className="h-4 w-4 mr-2" />
          {isLoading ? "Completing..." : "Mark Complete"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Form for snoozing a commitment
 */
function CommitmentSnoozeForm({
  commitment,
  onSnooze,
  onCancel,
  isLoading,
  setIsLoading,
  onSuccess,
}: {
  commitment: Commitment;
  onSnooze?: (id: string, until: Date) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onSuccess: () => void;
}) {
  const [snoozeDate, setSnoozeDate] = useState<Date | undefined>();

  const quickSnooze = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(9, 0, 0, 0);
    setSnoozeDate(date);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snoozeDate) return;

    setIsLoading(true);
    try {
      await onSnooze?.(commitment.id, snoozeDate);
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-muted/30 rounded-lg">
        <p className="font-medium">{commitment.content}</p>
        {commitment.snoozeCount > 0 && (
          <p className="text-sm text-orange-500 mt-1">
            Already snoozed {commitment.snoozeCount} times
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => quickSnooze(1)}>
          Tomorrow
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => quickSnooze(2)}>
          2 days
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => quickSnooze(7)}>
          1 week
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => quickSnooze(14)}>
          2 weeks
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Or pick a date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !snoozeDate && "text-muted-foreground"
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {snoozeDate ? format(snoozeDate, "PPP") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarPicker
              mode="single"
              selected={snoozeDate}
              onSelect={setSnoozeDate}
              initialFocus
              disabled={(date) => date < new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!snoozeDate || isLoading}>
          <Clock className="h-4 w-4 mr-2" />
          {isLoading ? "Snoozing..." : "Snooze"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Form for delegating a commitment
 */
function CommitmentDelegateForm({
  commitment,
  onDelegate,
  onCancel,
  isLoading,
  setIsLoading,
  onSuccess,
  people,
}: {
  commitment: Commitment;
  onDelegate?: (id: string, toPersonId: string, toPersonName: string) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onSuccess: () => void;
  people: Array<{ id: string; name: string }>;
}) {
  const [delegateToId, setDelegateToId] = useState("");
  const [delegateToName, setDelegateToName] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const handlePersonChange = (value: string) => {
    if (value === "custom") {
      setUseCustom(true);
      setDelegateToId("");
      setDelegateToName("");
    } else {
      setUseCustom(false);
      setDelegateToId(value);
      const person = people.find((p) => p.id === value);
      setDelegateToName(person?.name || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegateToName) return;

    setIsLoading(true);
    try {
      await onDelegate?.(commitment.id, delegateToId, delegateToName);
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-muted/30 rounded-lg">
        <p className="font-medium">{commitment.content}</p>
      </div>

      <div className="space-y-2">
        <Label>Delegate to</Label>
        {people.length > 0 && !useCustom ? (
          <Select value={delegateToId} onValueChange={handlePersonChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a person" />
            </SelectTrigger>
            <SelectContent>
              {people.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.name}
                </SelectItem>
              ))}
              <SelectItem value="custom">Enter name manually...</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Person's name"
              value={delegateToName}
              onChange={(e) => setDelegateToName(e.target.value)}
            />
            {people.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setUseCustom(false)}
              >
                Select
              </Button>
            )}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!delegateToName || isLoading}>
          <Forward className="h-4 w-4 mr-2" />
          {isLoading ? "Delegating..." : "Delegate"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function formatUrgency(urgency: string): string {
  switch (urgency) {
    case "asap": return "ASAP";
    case "today": return "Due today";
    case "this_week": return "This week";
    case "next_week": return "Next week";
    case "this_month": return "This month";
    case "when_possible": return "When possible";
    default: return urgency;
  }
}
