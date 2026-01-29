// CreatePipelineFromInboxModal - AI-assisted pipeline company creation from inbox

import { useState } from "react";
import { Building2, Sparkles, X, Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePipeline } from "@/hooks/usePipeline";
import { usePipelineContacts } from "@/hooks/usePipelineContacts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { InboxItem } from "@/types/inbox";
import type { CreatePipelineCompanyMetadata } from "@/types/inboxSuggestions";
import type { RoundEnum } from "@/types/pipeline";

interface CreatePipelineFromInboxModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inboxItem: InboxItem;
  prefillData: CreatePipelineCompanyMetadata;
  onCompanyCreated: (companyId: string, companyName: string) => void;
}

const ROUND_OPTIONS: { value: RoundEnum; label: string }[] = [
  { value: "Seed", label: "Seed" },
  { value: "Series A", label: "Series A" },
  { value: "Series B", label: "Series B" },
  { value: "Series C", label: "Series C" },
  { value: "Series D", label: "Series D" },
  { value: "Series E", label: "Series E" },
  { value: "Series F+", label: "Series F+" },
];

export function CreatePipelineFromInboxModal({
  open,
  onOpenChange,
  inboxItem,
  prefillData,
  onCompanyCreated,
}: CreatePipelineFromInboxModalProps) {
  const { createCompany } = usePipeline();
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState(prefillData.extracted_company_name);
  const [domain, setDomain] = useState(prefillData.extracted_domain || "");
  const [stage, setStage] = useState<RoundEnum>("Seed");
  const [source, setSource] = useState(prefillData.intro_source || "Warm Intro");
  const [contactName, setContactName] = useState(prefillData.primary_contact_name);
  const [contactEmail, setContactEmail] = useState(prefillData.primary_contact_email);
  const [description, setDescription] = useState(prefillData.description_oneliner);
  const [notes, setNotes] = useState(prefillData.notes_summary);
  const [tags, setTags] = useState<string[]>(prefillData.suggested_tags || []);
  const [newTag, setNewTag] = useState("");

  const handleAddTag = () => {
    const trimmed = newTag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleCreate = async () => {
    if (!companyName.trim()) {
      toast.error("Company name is required");
      return;
    }

    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setIsCreating(true);

    try {
      // 1. Create the pipeline company
      const newCompany = await createCompany({
        company_name: companyName.trim(),
        current_round: stage,
        website: domain ? `https://${domain.replace(/^https?:\/\//, "")}` : undefined,
        next_steps: `Source: ${source}`,
      });

      if (!newCompany?.id) {
        throw new Error("Failed to create company");
      }

      // 2. Create primary contact if we have contact info
      if (contactName.trim()) {
        const { error: contactError } = await supabase
          .from("pipeline_contacts")
          .insert({
            pipeline_company_id: newCompany.id,
            name: contactName.trim(),
            email: contactEmail || null,
            is_founder: true,
            is_primary: true,
            created_by: user.id,
          });

        if (contactError) {
          console.error("Error creating contact:", contactError);
          // Don't fail the whole operation for contact creation
        }
      }

      // 3. Create initial note with AI summary
      if (notes.trim()) {
        const { error: noteError } = await supabase
          .from("pipeline_interactions")
          .insert({
            pipeline_company_id: newCompany.id,
            interaction_type: "note",
            content: notes.trim(),
            occurred_at: new Date().toISOString(),
            created_by: user.id,
          });

        if (noteError) {
          console.error("Error creating note:", noteError);
        }
      }

      // 4. Call the callback to link the email
      onCompanyCreated(newCompany.id, companyName.trim());

      // Close modal
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating pipeline company:", error);
      toast.error("Failed to create company");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            Add to Pipeline
          </DialogTitle>
        </DialogHeader>

        {/* AI Badge */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Extracted from email - review and edit before creating</span>
        </div>

        <div className="space-y-4 mt-2">
          {/* Company Name */}
          <div className="space-y-1.5">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter company name"
            />
          </div>

          {/* Domain & Stage Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stage">Stage</Label>
              <Select value={stage} onValueChange={(v) => setStage(v as RoundEnum)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROUND_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Source */}
          <div className="space-y-1.5">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Warm Intro"
            />
          </div>

          {/* Primary Contact Section */}
          <div className="border-t pt-4 mt-4">
            <p className="text-xs font-medium text-muted-foreground mb-3">Primary Contact</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="contactName">Name</Label>
                <Input
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Contact name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One-liner about the company"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional context from the intro..."
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-destructive/20"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || !companyName.trim()}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Company"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
