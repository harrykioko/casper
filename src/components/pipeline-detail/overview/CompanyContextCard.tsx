import { useState } from 'react';
import { RefreshCw, Sparkles, MapPin, Users, Calendar, TrendingUp, Pencil, Loader2, DollarSign, User, Linkedin, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HarmonicEnrichment, KeyPerson } from '@/types/enrichment';
import { PipelineCompanyDetail } from '@/types/pipelineExtended';
import { formatDistanceToNow } from 'date-fns';

interface CompanyContextCardProps {
  company: PipelineCompanyDetail;
  enrichment: HarmonicEnrichment | null;
  loading: boolean;
  enriching: boolean;
  onEnrich: () => void;
  onRefresh: () => void;
  onChangeMatch: () => void;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount}`;
}

export function CompanyContextCard({
  company,
  enrichment,
  loading,
  enriching,
  onEnrich,
  onRefresh,
  onChangeMatch,
}: CompanyContextCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [rawJsonOpen, setRawJsonOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasDomainOrLinkedIn = !!(company.primary_domain || company.website);

  const handleCopyJson = async () => {
    if (enrichment?.source_payload) {
      await navigator.clipboard.writeText(JSON.stringify(enrichment.source_payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Loading state with skeleton
  if (loading) {
    return (
      <GlassPanel variant="subtle" padding="md">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Company context</span>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
      </GlassPanel>
    );
  }

  // Empty state - no enrichment
  if (!enrichment) {
    return (
      <GlassPanel variant="subtle" padding="md">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Company context</span>
          </div>
          <p className="text-sm text-muted-foreground">
            No Harmonic enrichment yet. Enrich to pull HQ, headcount, funding, and key people.
          </p>
          <div className="flex gap-2">
            {hasDomainOrLinkedIn ? (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onEnrich}
                disabled={enriching}
              >
                {enriching ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                )}
                Enrich using website domain
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onChangeMatch}
                disabled={enriching}
              >
                {enriching ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                )}
                Choose match...
              </Button>
            )}
            {hasDomainOrLinkedIn && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onChangeMatch}
                disabled={enriching}
              >
                Choose match...
              </Button>
            )}
          </div>
        </div>
      </GlassPanel>
    );
  }

  // Enriched state
  const description = expanded 
    ? enrichment.description_long || enrichment.description_short
    : enrichment.description_short;

  const showReadMore = enrichment.description_long && 
    enrichment.description_short && 
    enrichment.description_long.length > enrichment.description_short.length;

  // Build metadata chips - only show if not already in hero
  const chips: Array<{ icon: typeof MapPin; label: string }> = [];

  if (enrichment.hq_city) {
    const hqParts = [enrichment.hq_city];
    if (enrichment.hq_region) hqParts.push(enrichment.hq_region);
    else if (enrichment.hq_country) hqParts.push(enrichment.hq_country);
    chips.push({ icon: MapPin, label: hqParts.join(', ') });
  }

  if (enrichment.employee_range) {
    chips.push({ icon: Users, label: enrichment.employee_range });
  }

  if (enrichment.founding_year) {
    chips.push({ icon: Calendar, label: `Founded ${enrichment.founding_year}` });
  }

  // Funding info
  const fundingParts: string[] = [];
  if (enrichment.funding_stage && enrichment.funding_stage !== company.current_round) {
    fundingParts.push(enrichment.funding_stage);
  }
  if (enrichment.total_funding_usd) {
    fundingParts.push(formatCurrency(enrichment.total_funding_usd));
  }
  if (enrichment.last_funding_date) {
    fundingParts.push(enrichment.last_funding_date);
  }

  const confidenceColor = {
    high: 'bg-green-500/10 text-green-600 dark:text-green-400',
    medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    low: 'bg-red-500/10 text-red-600 dark:text-red-400',
  }[enrichment.confidence || 'medium'];

  const keyPeople = enrichment.key_people || [];

  return (
    <GlassPanel variant="subtle" padding="md">
      <div className="space-y-4">
        {/* Header with actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Company context</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={onRefresh}
              disabled={enriching}
              title="Refresh enrichment"
            >
              {enriching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={onChangeMatch}
              disabled={enriching}
              title="Change match"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Description */}
        {description && (
          <div>
            <p className={`text-sm text-muted-foreground ${!expanded ? 'line-clamp-3' : ''}`}>
              {description}
            </p>
            {showReadMore && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-primary hover:underline mt-1"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        {/* Metadata chips */}
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip, index) => (
              <Badge key={index} variant="secondary" className="text-xs font-normal">
                <chip.icon className="w-3 h-3 mr-1" />
                {chip.label}
              </Badge>
            ))}
          </div>
        )}

        {/* Funding row */}
        {fundingParts.length > 0 && (
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {fundingParts.join(' - ')}
            </span>
          </div>
        )}

        {/* Key People Section */}
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Key people</span>
          </div>

          {keyPeople.length > 0 ? (
            <div className="space-y-1.5">
              {keyPeople.slice(0, 5).map((person: KeyPerson, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-1"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{person.name}</p>
                      {person.title && (
                        <p className="text-xs text-muted-foreground truncate">{person.title}</p>
                      )}
                    </div>
                  </div>

                  {person.linkedin_url && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 flex-shrink-0"
                      asChild
                    >
                      <a 
                        href={person.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        title="View LinkedIn profile"
                      >
                        <Linkedin className="w-3 h-3" />
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No key people available from Harmonic.
            </p>
          )}
        </div>

        {/* Raw JSON collapsible */}
        {enrichment.source_payload && (
          <Collapsible open={rawJsonOpen} onOpenChange={setRawJsonOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between h-8 text-xs">
                <span>View raw JSON</span>
                {rawJsonOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="relative mt-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={handleCopyJson}
                  title="Copy JSON"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
                <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-auto max-h-60 border border-border/50">
                  {JSON.stringify(enrichment.source_payload, null, 2)}
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Footer with refresh time and confidence */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
          <span>
            Refreshed {formatDistanceToNow(new Date(enrichment.last_refreshed_at))} ago
          </span>
          {enrichment.confidence && (
            <Badge variant="secondary" className={`text-xs ${confidenceColor}`}>
              {enrichment.confidence}
            </Badge>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
