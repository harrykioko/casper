import { useState, useMemo } from "react";
import { Building2, Search, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePipeline } from "@/hooks/usePipeline";
import { usePortfolioCompanies } from "@/hooks/usePortfolioCompanies";
import type { InboxItem } from "@/types/inbox";

interface CompanyOption {
  id: string;
  name: string;
  type: "pipeline" | "portfolio";
  logoUrl?: string | null;
  domain?: string | null;
}

interface InlineLinkCompanyFormProps {
  emailItem: InboxItem;
  prefill?: {
    preselectedCompanyId?: string;
    companyName?: string;
  };
  onConfirm: (company: CompanyOption) => Promise<void>;
  onCancel: () => void;
}

export function InlineLinkCompanyForm({
  emailItem,
  prefill,
  onConfirm,
  onCancel,
}: InlineLinkCompanyFormProps) {
  const [search, setSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch companies
  const { companies: pipelineCompanies, loading: isLoadingPipeline } = usePipeline();
  const { companies: portfolioCompanies, loading: isLoadingPortfolio } = usePortfolioCompanies();

  // Combine and filter companies
  const allCompanies = useMemo(() => {
    const pipeline: CompanyOption[] = (pipelineCompanies || []).map((c) => ({
      id: c.id,
      name: c.company_name,
      type: "pipeline" as const,
      logoUrl: c.logo_url,
      domain: c.primary_domain,
    }));

    const portfolio: CompanyOption[] = (portfolioCompanies || []).map((c) => ({
      id: c.id,
      name: c.name,
      type: "portfolio" as const,
      logoUrl: c.logo_url,
      domain: c.primary_domain,
    }));

    return [...pipeline, ...portfolio];
  }, [pipelineCompanies, portfolioCompanies]);

  const filteredCompanies = useMemo(() => {
    if (!search.trim()) return allCompanies;
    const searchLower = search.toLowerCase();
    return allCompanies.filter(
      (c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.domain?.toLowerCase().includes(searchLower)
    );
  }, [allCompanies, search]);

  const handleSubmit = async () => {
    if (!selectedCompany) return;

    setIsSubmitting(true);
    try {
      await onConfirm(selectedCompany);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const isLoading = isLoadingPipeline || isLoadingPortfolio;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="p-3 rounded-lg border border-border bg-background space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
          <Building2 className="h-3.5 w-3.5" />
          Link Company
        </div>

        {/* Current link info */}
        {emailItem.relatedCompanyName && (
          <div className="p-2 rounded bg-muted border border-border">
            <p className="text-[10px] text-muted-foreground">
              Currently linked to: <span className="font-medium text-foreground">{emailItem.relatedCompanyName}</span>
            </p>
          </div>
        )}

        {/* Search */}
        <div className="relative" onKeyDown={handleKeyDown}>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies..."
            className="h-8 text-sm pl-8"
            autoFocus
          />
        </div>

        {/* Company list */}
        <ScrollArea className="h-[180px] border border-border rounded-md">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading...
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No companies found
            </div>
          ) : (
            <div className="p-1">
              {filteredCompanies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => setSelectedCompany(company)}
                  className={cn(
                    "w-full flex items-center gap-2 p-2 rounded text-left hover:bg-accent transition-colors",
                    selectedCompany?.id === company.id && "bg-accent"
                  )}
                >
                  <div className="w-6 h-6 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt=""
                        className="w-5 h-5 rounded object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {company.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{company.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {company.type === "pipeline" ? "Pipeline" : "Portfolio"}
                      {company.domain && ` • ${company.domain}`}
                    </p>
                  </div>
                  {selectedCompany?.id === company.id && (
                    <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-7 text-xs"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!selectedCompany || isSubmitting}
            className="h-7 text-xs flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Linking...
              </>
            ) : (
              "Confirm"
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
