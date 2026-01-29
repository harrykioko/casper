import { useState, useMemo } from "react";
import { Search, Building2, Briefcase, X, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePipeline } from "@/hooks/usePipeline";
import { usePortfolioCompanies } from "@/hooks/usePortfolioCompanies";
import { cn } from "@/lib/utils";
import type { InboxItem } from "@/types/inbox";

interface LinkCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inboxItem: InboxItem;
  onLinked: (companyId: string, companyName: string, companyType: 'pipeline' | 'portfolio', companyLogoUrl?: string | null) => void;
}

interface UnifiedCompany {
  id: string;
  name: string;
  type: 'pipeline' | 'portfolio';
  logo?: string | null;
  status?: string;
}

export function LinkCompanyModal({
  open,
  onOpenChange,
  inboxItem,
  onLinked,
}: LinkCompanyModalProps) {
  const [search, setSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<UnifiedCompany | null>(null);

  const { companies: pipelineCompanies, loading: pipelineLoading } = usePipeline();
  const { companies: portfolioCompanies, loading: portfolioLoading } = usePortfolioCompanies();

  const isLoading = pipelineLoading || portfolioLoading;

  const allCompanies = useMemo<UnifiedCompany[]>(() => {
    const pipeline = pipelineCompanies.map(c => ({
      id: c.id,
      name: c.company_name,
      type: 'pipeline' as const,
      logo: c.logo_url,
      status: c.current_round,
    }));

    const portfolio = portfolioCompanies.map(c => ({
      id: c.id,
      name: c.name,
      type: 'portfolio' as const,
      logo: c.logo_url,
      status: c.status,
    }));

    return [...pipeline, ...portfolio];
  }, [pipelineCompanies, portfolioCompanies]);

  const filteredCompanies = useMemo(() => {
    if (!search.trim()) return allCompanies;
    const searchLower = search.toLowerCase();
    return allCompanies.filter(c => 
      c.name.toLowerCase().includes(searchLower)
    );
  }, [allCompanies, search]);

  const pipelineFiltered = filteredCompanies.filter(c => c.type === 'pipeline');
  const portfolioFiltered = filteredCompanies.filter(c => c.type === 'portfolio');

  const handleConfirm = () => {
    if (selectedCompany) {
      onLinked(selectedCompany.id, selectedCompany.name, selectedCompany.type, selectedCompany.logo);
      onOpenChange(false);
      setSearch("");
      setSelectedCompany(null);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearch("");
    setSelectedCompany(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            Link to Company
          </DialogTitle>
        </DialogHeader>

        {/* Currently linked */}
        {inboxItem.relatedCompanyId && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm">
            <Check className="h-4 w-4 text-emerald-500" />
            <span className="text-muted-foreground">Currently linked to:</span>
            <span className="font-medium">{inboxItem.relatedCompanyName}</span>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        {/* Company List */}
        <ScrollArea className="h-[300px] -mx-2 px-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Loading companies...
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Building2 className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No companies found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pipeline Companies */}
              {pipelineFiltered.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <Briefcase className="h-3 w-3" />
                    Pipeline
                  </div>
                  <div className="space-y-1">
                    {pipelineFiltered.map((company) => (
                      <CompanyRow
                        key={company.id}
                        company={company}
                        isSelected={selectedCompany?.id === company.id}
                        onClick={() => setSelectedCompany(company)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio Companies */}
              {portfolioFiltered.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <Building2 className="h-3 w-3" />
                    Portfolio
                  </div>
                  <div className="space-y-1">
                    {portfolioFiltered.map((company) => (
                      <CompanyRow
                        key={company.id}
                        company={company}
                        isSelected={selectedCompany?.id === company.id}
                        onClick={() => setSelectedCompany(company)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedCompany}>
            Link Company
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CompanyRow({
  company,
  isSelected,
  onClick,
}: {
  company: UnifiedCompany;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors",
        isSelected
          ? "bg-primary/10 ring-1 ring-primary"
          : "hover:bg-muted/50"
      )}
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={company.logo || undefined} alt={company.name} />
        <AvatarFallback className="text-xs bg-muted">
          {company.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{company.name}</p>
      </div>
      {company.status && (
        <Badge variant="outline" className="text-[10px] capitalize">
          {company.status.replace(/_/g, ' ')}
        </Badge>
      )}
      {isSelected && (
        <Check className="h-4 w-4 text-primary flex-shrink-0" />
      )}
    </button>
  );
}
