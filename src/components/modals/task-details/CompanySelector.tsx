import { useState, useMemo } from "react";
import { Building2, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePortfolioCompanies } from "@/hooks/usePortfolioCompanies";
import { usePipeline } from "@/hooks/usePipeline";
import type { TaskCompanyLink } from "@/lib/taskCompanyLink";

interface CompanySelectorProps {
  companyLink: TaskCompanyLink | null;
  onCompanyChange: (link: TaskCompanyLink | null) => void;
}

interface CompanyOption {
  id: string;
  name: string;
  type: 'portfolio' | 'pipeline';
}

export function CompanySelector({ companyLink, onCompanyChange }: CompanySelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { companies: portfolioCompanies, loading: portfolioLoading } = usePortfolioCompanies();
  const { companies: pipelineCompanies, loading: pipelineLoading } = usePipeline();

  const loading = portfolioLoading || pipelineLoading;

  // Merge both lists into a unified list of options
  const allCompanies: CompanyOption[] = useMemo(() => {
    const portfolio = (portfolioCompanies || []).map(c => ({
      id: c.id,
      name: c.name,
      type: 'portfolio' as const,
    }));
    const pipeline = (pipelineCompanies || []).map(c => ({
      id: c.id,
      name: c.company_name,
      type: 'pipeline' as const,
    }));
    return [...portfolio, ...pipeline].sort((a, b) => a.name.localeCompare(b.name));
  }, [portfolioCompanies, pipelineCompanies]);

  // Find the currently selected company's display name
  const selectedName = useMemo(() => {
    if (!companyLink) return null;
    const found = allCompanies.find(c => c.id === companyLink.id && c.type === companyLink.type);
    return found?.name || companyLink.name || null;
  }, [companyLink, allCompanies]);

  // Filter by search term
  const filtered = useMemo(() => {
    if (!search.trim()) return allCompanies;
    const q = search.toLowerCase();
    return allCompanies.filter(c => c.name.toLowerCase().includes(q));
  }, [allCompanies, search]);

  const handleSelect = (company: CompanyOption | null) => {
    if (!company) {
      onCompanyChange(null);
    } else {
      onCompanyChange({ type: company.type, id: company.id, name: company.name });
    }
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="space-y-1">
      <label className="text-sm text-muted-foreground mb-1 block">Company</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-muted/20 border border-muted/40 rounded-md text-base font-normal hover:bg-muted/30"
          >
            {selectedName ? (
              <span className="flex items-center gap-2 truncate">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {selectedName}
              </span>
            ) : (
              <span className="text-muted-foreground">No company</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-popover backdrop-blur-md border border-muted/40 z-50" align="start">
          <div className="p-2 border-b border-muted/30">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm border-muted/30 bg-transparent focus-visible:ring-0"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-[200px] overflow-y-auto p-1">
            {/* Clear option */}
            <button
              className="w-full text-left px-3 py-1.5 text-sm rounded-sm hover:bg-muted/40 text-muted-foreground"
              onClick={() => handleSelect(null)}
            >
              No company
            </button>

            {loading ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">No companies found</div>
            ) : (
              filtered.map(company => (
                <button
                  key={`${company.type}-${company.id}`}
                  className={`w-full text-left px-3 py-1.5 text-sm rounded-sm hover:bg-muted/40 flex items-center gap-2 ${
                    companyLink?.id === company.id && companyLink?.type === company.type
                      ? 'bg-muted/30 text-foreground'
                      : 'text-foreground'
                  }`}
                  onClick={() => handleSelect(company)}
                >
                  <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="truncate">{company.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground shrink-0">
                    {company.type === 'pipeline' ? 'Pipeline' : 'Portfolio'}
                  </span>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
