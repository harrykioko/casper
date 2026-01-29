/**
 * CommitmentForm Component
 *
 * Form for creating and editing commitments.
 */

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, User, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CommitmentInsert, CommitmentUpdate, ImpliedUrgency } from "@/types/commitment";

interface CommitmentFormProps {
  initialValues?: Partial<CommitmentInsert>;
  onSubmit: (data: CommitmentInsert | CommitmentUpdate) => Promise<void>;
  onCancel?: () => void;
  isEditing?: boolean;
  isLoading?: boolean;
  people?: Array<{ id: string; name: string }>;
  companies?: Array<{ id: string; name: string; type: "portfolio" | "pipeline" }>;
}

const URGENCY_OPTIONS: { value: ImpliedUrgency; label: string }[] = [
  { value: "asap", label: "ASAP" },
  { value: "today", label: "Today" },
  { value: "this_week", label: "This week" },
  { value: "next_week", label: "Next week" },
  { value: "this_month", label: "This month" },
  { value: "when_possible", label: "When possible" },
];

export function CommitmentForm({
  initialValues,
  onSubmit,
  onCancel,
  isEditing = false,
  isLoading = false,
  people = [],
  companies = [],
}: CommitmentFormProps) {
  const [content, setContent] = useState(initialValues?.content || "");
  const [context, setContext] = useState(initialValues?.context || "");
  const [personId, setPersonId] = useState(initialValues?.personId || "");
  const [personName, setPersonName] = useState(initialValues?.personName || "");
  const [companyId, setCompanyId] = useState(initialValues?.companyId || "");
  const [companyType, setCompanyType] = useState<"portfolio" | "pipeline" | undefined>(
    initialValues?.companyType
  );
  const [companyName, setCompanyName] = useState(initialValues?.companyName || "");
  const [dueAt, setDueAt] = useState<Date | undefined>(
    initialValues?.dueAt ? new Date(initialValues.dueAt) : undefined
  );
  const [impliedUrgency, setImpliedUrgency] = useState<ImpliedUrgency | undefined>(
    initialValues?.impliedUrgency
  );
  const [useCustomPerson, setUseCustomPerson] = useState(!initialValues?.personId && !!initialValues?.personName);

  // Update person name when person is selected
  const handlePersonChange = (value: string) => {
    if (value === "custom") {
      setUseCustomPerson(true);
      setPersonId("");
      setPersonName("");
    } else {
      setUseCustomPerson(false);
      setPersonId(value);
      const person = people.find((p) => p.id === value);
      setPersonName(person?.name || "");
    }
  };

  // Update company details when company is selected
  const handleCompanyChange = (value: string) => {
    if (value === "none") {
      setCompanyId("");
      setCompanyType(undefined);
      setCompanyName("");
    } else {
      const company = companies.find((c) => c.id === value);
      if (company) {
        setCompanyId(company.id);
        setCompanyType(company.type);
        setCompanyName(company.name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    const data: CommitmentInsert = {
      content: content.trim(),
      context: context.trim() || undefined,
      personId: personId || undefined,
      personName: personName || undefined,
      companyId: companyId || undefined,
      companyType: companyType,
      companyName: companyName || undefined,
      dueAt: dueAt?.toISOString(),
      impliedUrgency: impliedUrgency,
    };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Content */}
      <div className="space-y-2">
        <Label htmlFor="content">What did you promise?</Label>
        <Textarea
          id="content"
          placeholder="I will send the deck by Friday..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[80px]"
          required
        />
      </div>

      {/* Context */}
      <div className="space-y-2">
        <Label htmlFor="context">Context (optional)</Label>
        <Textarea
          id="context"
          placeholder="From the call on Tuesday about Series A..."
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className="min-h-[60px]"
        />
      </div>

      {/* Person */}
      <div className="space-y-2">
        <Label>To whom?</Label>
        {people.length > 0 && !useCustomPerson ? (
          <Select
            value={personId || ""}
            onValueChange={handlePersonChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a person" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No specific person</SelectItem>
              {people.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.name}
                </SelectItem>
              ))}
              <SelectItem value="custom">Enter custom name...</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Person's name"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className="pl-9"
              />
            </div>
            {people.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUseCustomPerson(false);
                  setPersonName("");
                }}
              >
                Select
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Company */}
      {companies.length > 0 && (
        <div className="space-y-2">
          <Label>Related company (optional)</Label>
          <Select
            value={companyId || "none"}
            onValueChange={handleCompanyChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No company</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {company.name}
                    <span className="text-xs text-muted-foreground">
                      ({company.type})
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Due date and urgency */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Due date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dueAt && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueAt ? format(dueAt, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueAt}
                onSelect={setDueAt}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Implied urgency</Label>
          <Select
            value={impliedUrgency || ""}
            onValueChange={(v) => setImpliedUrgency(v as ImpliedUrgency || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No urgency set</SelectItem>
              {URGENCY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={!content.trim() || isLoading}>
          {isLoading ? "Saving..." : isEditing ? "Update" : "Add Commitment"}
        </Button>
      </div>
    </form>
  );
}

/**
 * Quick commitment input - single line
 */
interface QuickCommitmentInputProps {
  onAdd: (content: string) => void;
  placeholder?: string;
}

export function QuickCommitmentInput({
  onAdd,
  placeholder = "Add a commitment...",
}: QuickCommitmentInputProps) {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onAdd(content.trim());
      setContent("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center gap-3 p-3 rounded-xl bg-muted/20 backdrop-blur-md border border-muted/30 hover:ring-1 hover:ring-white/20 transition-all">
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          className="rounded-full h-8 w-8 flex-shrink-0 text-primary hover:bg-primary/10"
        >
          <Building2 className="h-4 w-4" />
        </Button>
        <Input
          type="text"
          placeholder={placeholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none text-base placeholder:text-muted-foreground"
        />
      </div>
    </form>
  );
}
