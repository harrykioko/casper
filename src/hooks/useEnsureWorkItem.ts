import { supabase } from "@/integrations/supabase/client";
import type { WorkItemSourceType } from "./useWorkQueue";

interface EnsureWorkItemResult {
  workItemId: string;
  isNew: boolean;
  status: string;
}

/**
 * Upserts a work_item and runs deterministic enrichment (domain matching).
 * Called after creating/fetching source items (emails, calendar events, tasks, etc.)
 */
export async function ensureWorkItem(
  sourceType: WorkItemSourceType,
  sourceId: string,
  userId: string
): Promise<EnsureWorkItemResult | null> {
  try {
    // Check if work item already exists
    const { data: existing } = await supabase
      .from("work_items")
      .select("id, status")
      .eq("source_type", sourceType)
      .eq("source_id", sourceId)
      .eq("created_by", userId)
      .maybeSingle();

    if (existing) {
      return { workItemId: existing.id, isNew: false, status: existing.status };
    }

    // Run deterministic enrichment to determine reason_codes and initial links
    const enrichment = await runDeterministicEnrichment(sourceType, sourceId, userId);

    // Determine initial status
    const hasUnresolved = enrichment.reasonCodes.length > 0;
    const status = hasUnresolved ? 'needs_review' : 'trusted';

    // Insert work item
    const { data: workItem, error } = await supabase
      .from("work_items")
      .insert({
        created_by: userId,
        source_type: sourceType,
        source_id: sourceId,
        status,
        reason_codes: enrichment.reasonCodes,
        priority: enrichment.priority,
        trusted_at: status === 'trusted' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (race condition)
      if (error.code === '23505') {
        const { data: raceExisting } = await supabase
          .from("work_items")
          .select("id, status")
          .eq("source_type", sourceType)
          .eq("source_id", sourceId)
          .eq("created_by", userId)
          .single();

        if (raceExisting) {
          return { workItemId: raceExisting.id, isNew: false, status: raceExisting.status };
        }
      }
      console.error("Error creating work item:", error);
      return null;
    }

    // Persist any confident entity links found
    if (enrichment.links.length > 0) {
      const linksToInsert = enrichment.links.map(link => ({
        created_by: userId,
        source_type: sourceType,
        source_id: sourceId,
        target_type: link.targetType,
        target_id: link.targetId,
        link_reason: link.reason,
        confidence: link.confidence,
      }));

      await supabase
        .from("entity_links")
        .upsert(linksToInsert, {
          onConflict: 'source_type,source_id,target_type,target_id,created_by',
        });
    }

    return { workItemId: workItem.id, isNew: true, status };
  } catch (err) {
    console.error("ensureWorkItem error:", err);
    return null;
  }
}

interface DeterministicEnrichmentResult {
  reasonCodes: string[];
  priority: number;
  links: Array<{
    targetType: 'company' | 'project';
    targetId: string;
    reason: string;
    confidence: number;
  }>;
}

async function runDeterministicEnrichment(
  sourceType: WorkItemSourceType,
  sourceId: string,
  userId: string
): Promise<DeterministicEnrichmentResult> {
  const reasonCodes: string[] = [];
  const links: DeterministicEnrichmentResult['links'] = [];
  let priority = 0;

  switch (sourceType) {
    case 'email': {
      const { data: email } = await supabase
        .from("inbox_items")
        .select("from_email, to_email, related_company_id, subject")
        .eq("id", sourceId)
        .single();

      if (email) {
        // If already linked to a company in inbox, carry that forward
        if (email.related_company_id) {
          links.push({
            targetType: 'company',
            targetId: email.related_company_id,
            reason: 'inbox_link',
            confidence: 1.0,
          });
        } else {
          // Try domain matching
          const companyMatch = await matchDomainToCompany(email.from_email, userId);
          if (companyMatch) {
            links.push({
              targetType: 'company',
              targetId: companyMatch.id,
              reason: 'domain_match',
              confidence: 0.9,
            });
          } else {
            reasonCodes.push('unlinked_company');
          }
        }
        // Emails always need summary enrichment
        reasonCodes.push('missing_summary');
        priority = 5;
      }
      break;
    }

    case 'calendar_event': {
      const { data: event } = await supabase
        .from("calendar_events")
        .select("attendees, title")
        .eq("id", sourceId)
        .single();

      if (event) {
        // Check for existing calendar_event_links
        const { data: calendarLink } = await supabase
          .from("calendar_event_links")
          .select("company_id")
          .eq("calendar_event_id", sourceId)
          .limit(1)
          .maybeSingle();

        if (calendarLink?.company_id) {
          links.push({
            targetType: 'company',
            targetId: calendarLink.company_id,
            reason: 'calendar_link',
            confidence: 1.0,
          });
        } else {
          // Try matching attendee domains
          const attendees = (event.attendees as any[]) || [];
          for (const attendee of attendees) {
            if (attendee?.email) {
              const match = await matchDomainToCompany(attendee.email, userId);
              if (match) {
                links.push({
                  targetType: 'company',
                  targetId: match.id,
                  reason: 'domain_match',
                  confidence: 0.85,
                });
                break;
              }
            }
          }
          if (links.length === 0) {
            reasonCodes.push('unlinked_company');
          }
        }
        priority = 3;
      }
      break;
    }

    case 'task': {
      const { data: task } = await supabase
        .from("tasks")
        .select("project_id, company_id, pipeline_company_id")
        .eq("id", sourceId)
        .single();

      if (task) {
        if (task.project_id) {
          links.push({
            targetType: 'project',
            targetId: task.project_id,
            reason: 'direct_link',
            confidence: 1.0,
          });
        }
        if (task.company_id) {
          links.push({
            targetType: 'company',
            targetId: task.company_id,
            reason: 'direct_link',
            confidence: 1.0,
          });
        }
        if (task.pipeline_company_id) {
          links.push({
            targetType: 'company',
            targetId: task.pipeline_company_id,
            reason: 'direct_link',
            confidence: 1.0,
          });
        }
        // If task has no links, it needs review
        if (!task.project_id && !task.company_id && !task.pipeline_company_id) {
          reasonCodes.push('unlinked_company');
        }
        priority = 2;
      }
      break;
    }

    case 'note': {
      const { data: note } = await supabase
        .from("project_notes")
        .select("project_id")
        .eq("id", sourceId)
        .single();

      if (note) {
        if (note.project_id) {
          links.push({
            targetType: 'project',
            targetId: note.project_id,
            reason: 'direct_link',
            confidence: 1.0,
          });
        } else {
          reasonCodes.push('unlinked_company');
        }
        priority = 1;
      }
      break;
    }

    case 'reading': {
      const { data: reading } = await supabase
        .from("reading_items")
        .select("project_id")
        .eq("id", sourceId)
        .single();

      if (reading) {
        if (reading.project_id) {
          links.push({
            targetType: 'project',
            targetId: reading.project_id,
            reason: 'direct_link',
            confidence: 1.0,
          });
        } else {
          reasonCodes.push('unlinked_company');
        }
        priority = 1;
      }
      break;
    }
  }

  return { reasonCodes, priority, links };
}

async function matchDomainToCompany(
  email: string | null,
  userId: string
): Promise<{ id: string; name: string; type: string } | null> {
  if (!email) return null;

  const domain = extractDomain(email);
  if (!domain || isGenericDomain(domain)) return null;

  // Check portfolio companies
  const { data: portfolioCompanies } = await supabase
    .from("companies")
    .select("id, name, primary_domain");

  if (portfolioCompanies) {
    for (const company of portfolioCompanies) {
      if (company.primary_domain && normalizeDomain(company.primary_domain) === domain) {
        return { id: company.id, name: company.name, type: 'portfolio' };
      }
    }
  }

  // Check pipeline companies
  const { data: pipelineCompanies } = await supabase
    .from("pipeline_companies")
    .select("id, company_name, primary_domain");

  if (pipelineCompanies) {
    for (const company of pipelineCompanies) {
      if (company.primary_domain && normalizeDomain(company.primary_domain) === domain) {
        return { id: company.id, name: company.company_name, type: 'pipeline' };
      }
    }
  }

  return null;
}

function extractDomain(email: string): string | null {
  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1) return null;
  return email.substring(atIndex + 1).toLowerCase().replace(/^www\./, '');
}

function normalizeDomain(domain: string): string {
  return domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
}

const GENERIC_DOMAINS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
  'aol.com', 'protonmail.com', 'mail.com', 'live.com', 'msn.com',
]);

function isGenericDomain(domain: string): boolean {
  return GENERIC_DOMAINS.has(domain);
}
