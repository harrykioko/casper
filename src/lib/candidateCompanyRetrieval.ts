// Candidate Company Retrieval for Inbox Suggestions V2
// Matches inbox items to potential companies using domain, name mention, and history

import Fuse from "fuse.js";
import { supabase } from "@/integrations/supabase/client";
import type { CandidateCompany } from "@/types/inboxSuggestions";

const MATCH_SCORES = {
  domain: 100,
  prior_link: 90,
  name_mention: 75,
  sender_history: 50,
};

interface CompanyRecord {
  id: string;
  name: string;
  primary_domain: string | null;
  type: "portfolio" | "pipeline";
}

/**
 * Extract domain from an email address
 */
export function extractDomainFromEmail(email: string): string | null {
  if (!email) return null;
  const parts = email.toLowerCase().split("@");
  if (parts.length !== 2) return null;
  return parts[1];
}

/**
 * Normalize domain for comparison (remove www, trailing dots)
 */
function normalizeDomain(domain: string | null): string | null {
  if (!domain) return null;
  return domain.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
}

/**
 * Fetch all companies (portfolio + pipeline) for a user
 */
async function fetchAllCompanies(): Promise<CompanyRecord[]> {
  const [portfolioResult, pipelineResult] = await Promise.all([
    supabase
      .from("companies")
      .select("id, name, primary_domain")
      .order("name"),
    supabase
      .from("pipeline_companies")
      .select("id, company_name, primary_domain")
      .order("company_name"),
  ]);

  const companies: CompanyRecord[] = [];

  if (portfolioResult.data) {
    for (const c of portfolioResult.data) {
      companies.push({
        id: c.id,
        name: c.name,
        primary_domain: c.primary_domain,
        type: "portfolio",
      });
    }
  }

  if (pipelineResult.data) {
    for (const c of pipelineResult.data) {
      companies.push({
        id: c.id,
        name: c.company_name,
        primary_domain: c.primary_domain,
        type: "pipeline",
      });
    }
  }

  return companies;
}

/**
 * Check for prior company links on inbox items from this sender
 */
async function findPriorLinks(senderEmail: string): Promise<Map<string, string>> {
  const domain = extractDomainFromEmail(senderEmail);
  if (!domain) return new Map();

  // Find inbox items with this sender domain that have a related company
  const { data } = await supabase
    .from("inbox_items")
    .select("from_email, related_company_id")
    .not("related_company_id", "is", null)
    .limit(50);

  const priorLinks = new Map<string, string>();

  if (data) {
    for (const item of data) {
      if (item.related_company_id) {
        const itemDomain = extractDomainFromEmail(item.from_email);
        // Exact sender match (prior_link) or same domain (sender_history)
        if (item.from_email.toLowerCase() === senderEmail.toLowerCase()) {
          priorLinks.set(item.related_company_id, "prior_link");
        } else if (itemDomain === domain && !priorLinks.has(item.related_company_id)) {
          priorLinks.set(item.related_company_id, "sender_history");
        }
      }
    }
  }

  return priorLinks;
}

/**
 * Find companies by domain match
 */
function findDomainMatches(
  companies: CompanyRecord[],
  senderDomain: string | null
): CandidateCompany[] {
  if (!senderDomain) return [];

  const normalizedSenderDomain = normalizeDomain(senderDomain);
  if (!normalizedSenderDomain) return [];

  const matches: CandidateCompany[] = [];

  for (const company of companies) {
    const companyDomain = normalizeDomain(company.primary_domain);
    if (companyDomain && companyDomain === normalizedSenderDomain) {
      matches.push({
        id: company.id,
        name: company.name,
        type: company.type,
        primary_domain: company.primary_domain,
        match_score: MATCH_SCORES.domain,
        match_reason: "domain",
      });
    }
  }

  return matches;
}

/**
 * Find companies by name mention in subject/body using fuzzy search
 */
function findNameMentions(
  companies: CompanyRecord[],
  subject: string,
  bodySnippet: string
): CandidateCompany[] {
  if (companies.length === 0) return [];

  // Combine subject and first 500 chars of body for search
  const searchText = `${subject} ${bodySnippet.slice(0, 500)}`.toLowerCase();

  // Use Fuse.js for fuzzy matching
  const fuse = new Fuse(companies, {
    keys: ["name"],
    threshold: 0.3, // Lower = stricter matching
    includeScore: true,
  });

  const matches: CandidateCompany[] = [];
  const seenIds = new Set<string>();

  // Also do simple substring check for exact matches
  for (const company of companies) {
    const companyNameLower = company.name.toLowerCase();
    // Skip very short names to avoid false positives
    if (companyNameLower.length < 3) continue;

    if (searchText.includes(companyNameLower)) {
      if (!seenIds.has(company.id)) {
        seenIds.add(company.id);
        matches.push({
          id: company.id,
          name: company.name,
          type: company.type,
          primary_domain: company.primary_domain,
          match_score: MATCH_SCORES.name_mention,
          match_reason: "name_mention",
        });
      }
    }
  }

  // Fuzzy search for additional matches
  for (const company of companies) {
    if (seenIds.has(company.id)) continue;

    const results = fuse.search(company.name);
    // Check if any result matches within our search text context
    if (results.length > 0 && results[0].score !== undefined && results[0].score < 0.3) {
      // Additional validation: check if the name appears in the text
      const nameWords = company.name.toLowerCase().split(/\s+/);
      const significantWord = nameWords.find((w) => w.length >= 4);
      if (significantWord && searchText.includes(significantWord)) {
        seenIds.add(company.id);
        matches.push({
          id: company.id,
          name: company.name,
          type: company.type,
          primary_domain: company.primary_domain,
          match_score: MATCH_SCORES.name_mention - 10, // Slightly lower for fuzzy
          match_reason: "name_mention",
        });
      }
    }
  }

  return matches;
}

/**
 * Main function: retrieve candidate companies for an inbox item
 */
export async function retrieveCandidateCompanies(
  senderEmail: string,
  subject: string,
  bodySnippet: string
): Promise<CandidateCompany[]> {
  const [companies, priorLinks] = await Promise.all([
    fetchAllCompanies(),
    findPriorLinks(senderEmail),
  ]);

  const senderDomain = extractDomainFromEmail(senderEmail);
  const candidateMap = new Map<string, CandidateCompany>();

  // 1. Domain matches (highest priority)
  const domainMatches = findDomainMatches(companies, senderDomain);
  for (const match of domainMatches) {
    candidateMap.set(match.id, match);
  }

  // 2. Prior links (second highest)
  for (const [companyId, reasonType] of priorLinks) {
    const company = companies.find((c) => c.id === companyId);
    if (company && !candidateMap.has(companyId)) {
      candidateMap.set(companyId, {
        id: company.id,
        name: company.name,
        type: company.type,
        primary_domain: company.primary_domain,
        match_score:
          reasonType === "prior_link"
            ? MATCH_SCORES.prior_link
            : MATCH_SCORES.sender_history,
        match_reason: reasonType as "prior_link" | "sender_history",
      });
    } else if (candidateMap.has(companyId)) {
      // Boost existing match if also has prior link
      const existing = candidateMap.get(companyId)!;
      if (reasonType === "prior_link") {
        existing.match_score = Math.max(
          existing.match_score,
          MATCH_SCORES.prior_link
        );
      }
    }
  }

  // 3. Name mentions
  const nameMentions = findNameMentions(companies, subject, bodySnippet);
  for (const match of nameMentions) {
    if (!candidateMap.has(match.id)) {
      candidateMap.set(match.id, match);
    }
  }

  // Sort by score descending and take top 8
  const candidates = Array.from(candidateMap.values())
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 8);

  return candidates;
}
