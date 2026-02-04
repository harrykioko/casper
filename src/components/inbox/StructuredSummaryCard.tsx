import { useState } from "react";
import { CheckCircle2, Circle, Wand2, Loader2, Building2, User, Landmark, Briefcase, Box, Wrench, HelpCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface StructuredSummaryCardProps {
  summary: string;
  keyPoints: string[];
  nextStep: { label: string; isActionRequired: boolean };
  categories: string[];
  entities: Array<{ name: string; type: string; confidence: number }>;
  people: Array<{ name: string; email?: string | null; confidence: number }>;
}

interface GenerateSummaryPlaceholderProps {
  onGenerate: () => void;
  isGenerating: boolean;
  error?: Error | null;
}

const entityTypeConfig: Record<string, { icon: typeof Building2; color: string }> = {
  company: { icon: Building2, color: "text-sky-600 dark:text-sky-400" },
  bank: { icon: Landmark, color: "text-emerald-600 dark:text-emerald-400" },
  fund: { icon: Briefcase, color: "text-purple-600 dark:text-purple-400" },
  product: { icon: Box, color: "text-orange-600 dark:text-orange-400" },
  tool: { icon: Wrench, color: "text-slate-600 dark:text-slate-400" },
  person: { icon: User, color: "text-rose-600 dark:text-rose-400" },
  other: { icon: HelpCircle, color: "text-muted-foreground" },
};

const categoryColors: Record<string, string> = {
  update: "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300",
  request: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  intro: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  scheduling: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  follow_up: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
  finance: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  other: "bg-muted text-muted-foreground",
};

export function StructuredSummaryCard({
  summary,
  keyPoints,
  nextStep,
  categories,
  entities,
  people,
}: StructuredSummaryCardProps) {
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false);

  const hasEntities = entities.length > 0;
  const hasPeople = people.length > 0;
  const hasMetadata = hasEntities || hasPeople;
  const hasCategories = categories.length > 0;
  const hasFooter = hasCategories || hasMetadata;

  return (
    <div className="rounded-lg border border-border/50 bg-card/30 divide-y divide-border/30">
      {/* Overview Section */}
      <div className="p-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
          Overview
        </h3>
        <p className="text-sm text-foreground leading-relaxed">{summary}</p>
      </div>

      {/* Key Points Section */}
      {keyPoints.length > 0 && (
        <div className="p-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">
            Key Points
          </h3>
          <ul className="space-y-1.5 pl-4">
            {keyPoints.map((point, index) => (
              <li 
                key={index} 
                className="text-sm text-foreground leading-relaxed list-disc marker:text-muted-foreground/60"
              >
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Step Section */}
      <div className="p-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
          Next Step
        </h3>
        <div className="flex items-center gap-2">
          {nextStep.isActionRequired ? (
            <Circle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
          )}
          <span className="text-sm text-foreground">{nextStep.label}</span>
        </div>
      </div>

      {/* Footer: Categories + Metadata */}
      {hasFooter && (
        <div className="p-3">
          <div className="flex items-center flex-wrap gap-2">
            {/* Category badges */}
            {categories.map((category) => (
              <Badge
                key={category}
                variant="secondary"
                className={cn(
                  "text-[10px] font-medium capitalize border-0 px-2 py-0.5",
                  categoryColors[category] || categoryColors.other
                )}
              >
                {category.replace("_", " ")}
              </Badge>
            ))}

            {/* Entity/People count chips (expandable) */}
            {hasMetadata && (
              <Collapsible open={isMetadataExpanded} onOpenChange={setIsMetadataExpanded}>
                <CollapsibleTrigger className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-muted/50">
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform",
                      isMetadataExpanded && "rotate-180"
                    )}
                  />
                  {hasEntities && (
                    <span className="inline-flex items-center gap-0.5">
                      <Building2 className="h-3 w-3" />
                      {entities.length}
                    </span>
                  )}
                  {hasPeople && (
                    <span className="inline-flex items-center gap-0.5">
                      <User className="h-3 w-3" />
                      {people.length}
                    </span>
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2">
                  {/* Entities */}
                  {hasEntities && (
                    <div className="flex flex-wrap gap-1.5">
                      {entities.map((entity, index) => {
                        const config = entityTypeConfig[entity.type] || entityTypeConfig.other;
                        const Icon = config.icon;
                        return (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/50 border border-border/50 text-xs"
                          >
                            <Icon className={cn("h-3 w-3", config.color)} />
                            <span className="text-foreground">{entity.name}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* People */}
                  {hasPeople && (
                    <div className="flex flex-wrap gap-1.5">
                      {people.map((person, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/50 border border-border/50 text-xs"
                        >
                          <User className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                          <span className="text-foreground">{person.name}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function GenerateSummaryPlaceholder({
  onGenerate,
  isGenerating,
  error,
}: GenerateSummaryPlaceholderProps) {
  return (
    <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-6 text-center">
      <Wand2 className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground mb-1">Generate a structured summary</p>
      <p className="text-xs text-muted-foreground/70 mb-3">
        Creates an overview, key points, and extracts entities for action workflows.
      </p>
      {error && (
        <p className="text-xs text-destructive mb-3">
          {error.message || "Failed to generate. Try again."}
        </p>
      )}
      <Button size="sm" onClick={onGenerate} disabled={isGenerating}>
        {isGenerating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {isGenerating ? "Generating..." : "Generate summary"}
      </Button>
    </div>
  );
}
