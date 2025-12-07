import { useMemo } from 'react';
import { useDashboardPortfolioCompanies } from './useDashboardPortfolioCompanies';
import { useDashboardPipelineFocus } from './useDashboardPipelineFocus';
import { AttentionSignal, AttentionStatus, CompanyAttentionState } from '@/types/attention';

interface RawDashboardCompany {
  id: string;
  entityType: 'portfolio' | 'pipeline';
  name: string;
  logoUrl: string | null;
  lastInteractionAt: string | null;
  openTaskCount: number;
  nextStepText: string | null;
  pipelineStatus?: string;
}

function daysSince(dateString: string | null): number | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function generateSignals(company: RawDashboardCompany): AttentionSignal[] {
  const signals: AttentionSignal[] = [];
  const now = new Date().toISOString();
  const daysSinceInteraction = daysSince(company.lastInteractionAt);

  // No interaction in over 30 days or never
  if (daysSinceInteraction === null || daysSinceInteraction > 30) {
    signals.push({
      source: 'interactions',
      weight: 0.9,
      description: daysSinceInteraction === null 
        ? 'No interactions recorded' 
        : 'No interaction in over 30 days',
      timestamp: now,
    });
  }
  // Stale interaction 14-30 days ago
  else if (daysSinceInteraction >= 14) {
    signals.push({
      source: 'interactions',
      weight: 0.5,
      description: 'Last touch was a few weeks ago',
      timestamp: now,
    });
  }

  // Open tasks with no clear next step
  if (company.openTaskCount > 0 && !company.nextStepText) {
    signals.push({
      source: 'tasks',
      weight: 0.8,
      description: 'Open tasks with no clear next step',
      timestamp: now,
    });
  }
  // No next step defined (even without open tasks)
  else if (!company.nextStepText) {
    signals.push({
      source: 'tasks',
      weight: 0.3,
      description: 'No next step defined',
      timestamp: now,
    });
  }

  return signals;
}

function calculateScore(signals: AttentionSignal[]): number {
  return signals.reduce((sum, s) => sum + s.weight, 0);
}

function scoreToStatus(score: number): AttentionStatus {
  if (score >= 1.2) return 'red';
  if (score >= 0.4) return 'yellow';
  return 'green';
}

export function useCompanyAttention() {
  const { companies: portfolioCompanies, loading: portfolioLoading, refetch: refetchPortfolio } = useDashboardPortfolioCompanies();
  const { companies: pipelineCompanies, loading: pipelineLoading, refetch: refetchPipeline } = useDashboardPipelineFocus();

  const companies = useMemo<CompanyAttentionState[]>(() => {
    const normalized: RawDashboardCompany[] = [];

    // Normalize portfolio companies
    portfolioCompanies.forEach(c => {
      normalized.push({
        id: c.id,
        entityType: 'portfolio',
        name: c.name,
        logoUrl: c.logo_url,
        lastInteractionAt: c.last_interaction_at,
        openTaskCount: c.open_task_count,
        nextStepText: c.next_task,
      });
    });

    // Normalize pipeline companies
    pipelineCompanies.forEach(c => {
      normalized.push({
        id: c.id,
        entityType: 'pipeline',
        name: c.company_name,
        logoUrl: c.logo_url,
        lastInteractionAt: c.last_interaction_at,
        openTaskCount: 0, // Pipeline doesn't track this in the dashboard hook
        nextStepText: c.next_steps,
        pipelineStatus: c.status,
      });
    });

    // Transform to attention states
    return normalized.map(company => {
      const signals = generateSignals(company);
      const score = calculateScore(signals);
      const status = scoreToStatus(score);

      return {
        companyId: company.id,
        entityType: company.entityType,
        name: company.name,
        logoUrl: company.logoUrl,
        pipelineStatus: company.pipelineStatus,
        status,
        score,
        signals,
      };
    });
  }, [portfolioCompanies, pipelineCompanies]);

  const isLoading = portfolioLoading || pipelineLoading;

  const refetch = () => {
    refetchPortfolio();
    refetchPipeline();
  };

  return { companies, isLoading, refetch };
}
