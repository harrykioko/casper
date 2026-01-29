import { useState } from 'react';
import { Search, Building2, Loader2, MapPin, Users, TrendingUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HarmonicCandidate } from '@/types/enrichment';

interface HarmonicMatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  onSearch: (query: string) => Promise<HarmonicCandidate[]>;
  onSelectCandidate: (candidate: HarmonicCandidate) => Promise<void>;
  searching: boolean;
}

export function HarmonicMatchModal({
  open,
  onOpenChange,
  companyName,
  onSearch,
  onSelectCandidate,
  searching,
}: HarmonicMatchModalProps) {
  const [query, setQuery] = useState(companyName);
  const [candidates, setCandidates] = useState<HarmonicCandidate[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setHasSearched(true);
    const results = await onSearch(query.trim());
    setCandidates(results);
  };

  const handleSelect = async (candidate: HarmonicCandidate) => {
    setSelecting(candidate.harmonic_id);
    try {
      await onSelectCandidate(candidate);
      onOpenChange(false);
    } finally {
      setSelecting(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Match company in Harmonic</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Company name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={searching || !query.trim()}>
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </div>

          {/* Results */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {searching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!searching && hasSearched && candidates.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No matching companies found. Try a different search.
              </div>
            )}

            {!searching && candidates.map((candidate) => (
              <div
                key={candidate.harmonic_id}
                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{candidate.name}</span>
                        {candidate.domain && (
                          <span className="text-xs text-muted-foreground">
                            • {candidate.domain}
                          </span>
                        )}
                      </div>
                      {candidate.description_short && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {candidate.description_short}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {candidate.hq && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            <MapPin className="w-3 h-3 mr-1" />
                            {candidate.hq}
                          </Badge>
                        )}
                        {candidate.employee_range && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            <Users className="w-3 h-3 mr-1" />
                            {candidate.employee_range}
                          </Badge>
                        )}
                        {candidate.funding_stage && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {candidate.funding_stage}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSelect(candidate)}
                    disabled={selecting === candidate.harmonic_id}
                  >
                    {selecting === candidate.harmonic_id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Select'
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
