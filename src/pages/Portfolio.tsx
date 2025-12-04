import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { usePortfolioCompanies } from '@/hooks/usePortfolioCompanies';
import { useCompanyContacts } from '@/hooks/useCompanyContacts';
import { PortfolioCompanyCard } from '@/components/portfolio/PortfolioCompanyCard';
import { PortfolioFilters } from '@/components/portfolio/PortfolioFilters';
import { AddCompanyModal } from '@/components/portfolio/AddCompanyModal';
import { CompanyStatus, FounderInput } from '@/types/portfolio';
import { DashboardLoading } from '@/components/dashboard/DashboardLoading';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Portfolio() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<CompanyStatus | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);

  const { companies, loading, createCompany, refetch } = usePortfolioCompanies(statusFilter);

  const handleCreateCompany = async (data: {
    name: string;
    website_url?: string;
    logo_url?: string;
    status: CompanyStatus;
    founders: FounderInput[];
  }) => {
    if (!user) return;

    // Create the company
    const company = await createCompany({
      name: data.name,
      website_url: data.website_url,
      logo_url: data.logo_url,
      status: data.status,
    });

    if (!company) return;

    // Create founders
    if (data.founders.length > 0) {
      const foundersToInsert = data.founders
        .filter((f) => f.name.trim())
        .map((f) => ({
          company_id: company.id,
          name: f.name,
          email: f.email || null,
          role: f.role || null,
          is_founder: true,
          is_primary: f.is_primary,
          created_by: user.id,
        }));

      if (foundersToInsert.length > 0) {
        const { error } = await supabase
          .from('company_contacts')
          .insert(foundersToInsert);

        if (error) {
          console.error('Error creating founders:', error);
          toast.error('Company created but failed to add founders');
        }
      }
    }

    refetch();
  };

  if (loading) {
    return <DashboardLoading />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-6 lg:p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Portfolio</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {companies.length} {companies.length === 1 ? 'company' : 'companies'}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <PortfolioFilters
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />
      </div>

      {/* Companies Grid */}
      {companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Briefcase className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            No companies yet
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Start tracking your portfolio by adding your first company.
          </p>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <PortfolioCompanyCard
              key={company.id}
              company={company}
              onClick={() => navigate(`/portfolio/${company.id}`)}
            />
          ))}
        </div>
      )}

      {/* Add Company Modal */}
      <AddCompanyModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleCreateCompany}
      />
    </motion.div>
  );
}
