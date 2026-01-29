export interface HarmonicEnrichment {
  id: string;
  pipeline_company_id: string;
  harmonic_company_id?: string | null;
  match_method?: 'domain' | 'linkedin' | 'search' | null;
  confidence?: 'high' | 'medium' | 'low' | null;
  description_short?: string | null;
  description_long?: string | null;
  hq_city?: string | null;
  hq_region?: string | null;
  hq_country?: string | null;
  employee_range?: string | null;
  founding_year?: number | null;
  funding_stage?: string | null;
  total_funding_usd?: number | null;
  last_funding_date?: string | null;
  linkedin_url?: string | null;
  twitter_url?: string | null;
  key_people?: KeyPerson[];
  source_payload?: Record<string, unknown>;
  enriched_at: string;
  last_refreshed_at: string;
  created_by: string;
  created_at: string;
}

export interface KeyPerson {
  name: string;
  title: string;
  linkedin_url?: string | null;
}

export interface HarmonicCandidate {
  harmonic_id: string;
  name: string;
  domain?: string | null;
  linkedin_url?: string | null;
  logo_url?: string | null;
  hq?: string | null;
  employee_range?: string | null;
  description_short?: string | null;
  funding_stage?: string | null;
}

export type EnrichmentMode = 'enrich_by_domain' | 'enrich_by_linkedin' | 'refresh' | 'search_candidates';
