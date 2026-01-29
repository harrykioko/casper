import { useState } from 'react';
import { RefreshCw, Sparkles, MapPin, Users, Calendar, TrendingUp, Pencil, Loader2 } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HarmonicEnrichment } from '@/types/enrichment';
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

  const hasDomainOrLinkedIn = !!(company.primary_domain || company.website);

  // If loading, show skeleton
  if (loading) {
    return (
      <GlassPanel variant="subtle" padding="md">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-3 bg-muted rounded w-2/3" />
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
            Add Harmonic enrichment for background + key people.
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
                Enrich with Harmonic
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
                Find match
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

  // Only show funding_stage if different from current_round in header
  if (enrichment.funding_stage && enrichment.funding_stage !== company.current_round) {
    chips.push({ icon: TrendingUp, label: enrichment.funding_stage });
  }

  const confidenceColor = {
    high: 'bg-green-500/10 text-green-600 dark:text-green-400',
    medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    low: 'bg-red-500/10 text-red-600 dark:text-red-400',
  }[enrichment.confidence || 'medium'];

  return (
    <GlassPanel variant="subtle" padding="md">
      <div className="space-y-3">
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
            <p className={`text-sm text-muted-foreground ${!expanded ? 'line-clamp-2' : ''}`}>
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

        {/* Footer with refresh time and confidence */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
          <span>
            Last refreshed: {formatDistanceToNow(new Date(enrichment.last_refreshed_at))} ago
          </span>
          {enrichment.confidence && (
            <Badge variant="secondary" className={`text-xs ${confidenceColor}`}>
              Confidence: {enrichment.confidence}
            </Badge>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
