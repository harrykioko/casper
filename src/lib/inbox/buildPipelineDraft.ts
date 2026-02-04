/**
 * Pipeline Draft Builder
 * 
 * Utilities for building PipelineCompanyDraft from email data.
 * Includes domain inference, intro signal detection, and smart prefills.
 */

import { getDomainFromEmail } from "@/lib/domainMatching";
import type { InboxItem } from "@/types/inbox";
import type { StructuredSuggestion, CreatePipelineCompanyMetadata } from "@/types/inboxSuggestions";
import type { PipelineCompanyDraft, ConfidenceLevel } from "@/types/emailActionDrafts";
import { buildTaskNoteFromEmail } from "./buildTaskNote";

// Generic email domains that should not be used for company identification
const GENERIC_DOMAINS = new Set([
  "gmail.com", "googlemail.com",
  "yahoo.com", "ymail.com",
  "outlook.com", "hotmail.com", "live.com", "msn.com",
  "icloud.com", "me.com", "mac.com",
  "aol.com",
  "protonmail.com", "proton.me",
  "zoho.com", "mail.com", "fastmail.com",
  "hey.com", "tutanota.com", "mailbox.org",
]);

function isGenericDomain(domain: string): boolean {
  return GENERIC_DOMAINS.has(domain.toLowerCase());
}

// Strong signals for intro/follow-up detection
const INTRO_SUBJECT_PATTERNS = [
  /\bintro(?:duction)?\b/i,
  /\bconnect(?:ing)?\b/i,
  /\bmeet(?:ing)?\b/i,
  /\bfollow(?:ing)?\s*up\b/i,
  /\bcircling\s*back\b/i,
  /\bwarm\s*intro\b/i,
  /\bdouble\s*opt[\s-]*in\b/i,
];

const SCHEDULING_BODY_PATTERNS = [
  /\b(demo|walkthrough|quick\s+call|availability|calendar)\b/i,
  /\b(schedule|meeting|book\s+a\s+time)\b/i,
  /\b(15\s*min|30\s*min|coffee|chat)\b/i,
];

export interface IntroSignalResult {
  isLikelyIntro: boolean;
  signals: string[];
  confidence: number;
}

/**
 * Detect signals that indicate this email is an intro or follow-up
 */
export function detectIntroSignals(item: InboxItem): IntroSignalResult {
  const signals: string[] = [];
  const subject = item.displaySubject || item.subject || "";
  const body = item.cleanedText || item.displaySnippet || "";
  
  // Subject pattern matching
  for (const pattern of INTRO_SUBJECT_PATTERNS) {
    if (pattern.test(subject)) {
      signals.push("Subject contains intro/connect language");
      break;
    }
  }
  
  // Body scheduling language
  for (const pattern of SCHEDULING_BODY_PATTERNS) {
    if (pattern.test(body)) {
      signals.push("Body contains scheduling language");
      break;
    }
  }
  
  // Extracted categories from AI
  const categories = item.extractedCategories || [];
  if (categories.some(c => ["intro", "follow_up", "scheduling", "request"].includes(c))) {
    signals.push("AI categorized as intro/follow-up/scheduling");
  }
  
  // Has extracted entities (company/product)
  const entities = item.extractedEntities || [];
  if (entities.some(e => ["company", "product", "organization", "startup"].includes(e.type?.toLowerCase() || ""))) {
    signals.push("Contains company/product entity");
  }
  
  // Non-generic sender domain
  const senderDomain = getDomainFromEmail(item.senderEmail);
  if (senderDomain && !isGenericDomain(senderDomain)) {
    signals.push("Professional sender domain");
  }
  
  // Pitch language in body
  if (/\b(raising|fundraise|round|traction|ARR|MRR|deck|pitch|seed|series)\b/i.test(body)) {
    signals.push("Contains pitch/fundraising language");
  }
  
  const confidence = Math.min(signals.length / 3, 1);
  
  return {
    isLikelyIntro: signals.length >= 2,
    signals,
    confidence,
  };
}

export interface DomainInferenceResult {
  domain: string | null;
  source: "sender" | "body_url" | "entity" | null;
  confidence: number;
}

/**
 * Infer company domain from email data
 */
export function inferDomainFromEmail(item: InboxItem): DomainInferenceResult {
  // 1. Try sender email domain (if not generic)
  const senderDomain = getDomainFromEmail(item.senderEmail);
  if (senderDomain && !isGenericDomain(senderDomain)) {
    return { domain: senderDomain, source: "sender", confidence: 0.9 };
  }
  
  // 2. Try extracting from body URLs
  const body = item.cleanedText || item.body || "";
  const urlMatch = body.match(/https?:\/\/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (urlMatch) {
    const extractedDomain = urlMatch[1].replace(/^www\./, "");
    if (!isGenericDomain(extractedDomain)) {
      return { domain: extractedDomain, source: "body_url", confidence: 0.7 };
    }
  }
  
  return { domain: null, source: null, confidence: 0 };
}

export interface CompanyNameInferenceResult {
  name: string;
  source: "entity" | "sender" | "domain" | null;
  confidence: ConfidenceLevel;
}

/**
 * Infer company name from email data
 */
export function inferCompanyName(item: InboxItem): CompanyNameInferenceResult {
  // 1. From extracted entities
  const entities = item.extractedEntities || [];
  const companyEntity = entities.find(e => 
    ["company", "organization", "product", "startup"].includes(e.type?.toLowerCase() || "") && 
    e.confidence > 0.6
  );
  if (companyEntity) {
    return { name: companyEntity.name, source: "entity", confidence: "suggested" };
  }
  
  // 2. From sender name (if professional format with Inc, Ltd, etc.)
  if (item.senderName) {
    if (/\b(inc|ltd|llc|corp|co\.?|labs?|studios?|ventures?|capital)\b/i.test(item.senderName)) {
      return { name: item.senderName, source: "sender", confidence: "suggested" };
    }
  }
  
  // 3. Derive from inferred domain
  const domainInfo = inferDomainFromEmail(item);
  if (domainInfo.domain) {
    // Capitalize domain root as company name guess
    const domainRoot = domainInfo.domain.split(".")[0];
    const guessedName = domainRoot.charAt(0).toUpperCase() + domainRoot.slice(1);
    return { name: guessedName, source: "domain", confidence: "suggested" };
  }
  
  return { name: "", source: null, confidence: "suggested" };
}

/**
 * Infer pipeline stage from email context
 */
export function inferStageFromContext(item: InboxItem): string | null {
  const subject = (item.displaySubject || item.subject || "").toLowerCase();
  const body = (item.cleanedText || "").toLowerCase();
  const combined = subject + " " + body;
  
  if (/\b(intro|introduction|connect|first\s+meeting|warm\s+intro)\b/.test(combined)) {
    return "Seed"; // Default starting stage for new intros
  }
  if (/\b(demo|deep\s+dive|schedule|walkthrough|follow\s*up)\b/.test(combined)) {
    return "Seed";
  }
  return null;
}

/**
 * Build a PipelineCompanyDraft from an AI suggestion
 */
export function buildPipelineDraftFromSuggestion(
  item: InboxItem,
  suggestion: StructuredSuggestion
): PipelineCompanyDraft {
  const metadata = suggestion.metadata as unknown as CreatePipelineCompanyMetadata | undefined;
  const domainInfo = inferDomainFromEmail(item);
  
  // Extract key points safely
  const keyPoints = (item.extractedKeyPoints || []).slice(0, 3).map(kp => {
    if (typeof kp === "string") return kp;
    if (typeof kp === "object" && kp !== null) {
      return (kp as { text?: string; content?: string }).text || 
             (kp as { text?: string; content?: string }).content || "";
    }
    return "";
  }).filter(Boolean);
  
  return {
    companyName: metadata?.extracted_company_name || "",
    companyNameConfidence: metadata?.extracted_company_name ? "suggested" : undefined,
    domain: metadata?.extracted_domain || domainInfo.domain,
    domainConfidence: (metadata?.extracted_domain || domainInfo.source) ? "suggested" : undefined,
    website: metadata?.extracted_domain 
      ? `https://${metadata.extracted_domain}` 
      : domainInfo.domain 
        ? `https://${domainInfo.domain}` 
        : undefined,
    contacts: metadata?.primary_contact_name ? [{
      name: metadata.primary_contact_name,
      email: metadata.primary_contact_email || item.senderEmail,
      confidence: "suggested" as ConfidenceLevel,
    }] : [{
      name: item.senderName || "",
      email: item.senderEmail,
      confidence: "suggested" as ConfidenceLevel,
    }],
    contextSummary: metadata?.notes_summary || buildTaskNoteFromEmail(item),
    keyPoints,
    introSource: metadata?.intro_source || `Email from ${item.senderName || item.senderEmail}`,
    suggestedStage: inferStageFromContext(item) || undefined,
    suggestedTags: metadata?.suggested_tags || [],
    reason: suggestion.rationale,
    sourceEmailId: item.id,
    confidence: {
      isIntroOrFollowup: suggestion.confidence === "high" ? 0.9 : suggestion.confidence === "medium" ? 0.7 : 0.5,
      companyMatch: 0,
      domainInferred: domainInfo.confidence,
    },
  };
}

/**
 * Build a PipelineCompanyDraft for manual creation (no AI suggestion)
 */
export function buildManualPipelineDraft(item: InboxItem): PipelineCompanyDraft {
  const domainInfo = inferDomainFromEmail(item);
  const nameInfo = inferCompanyName(item);
  const introSignals = detectIntroSignals(item);
  
  // Extract key points safely
  const keyPoints = (item.extractedKeyPoints || []).slice(0, 3).map(kp => {
    if (typeof kp === "string") return kp;
    if (typeof kp === "object" && kp !== null) {
      return (kp as { text?: string; content?: string }).text || 
             (kp as { text?: string; content?: string }).content || "";
    }
    return "";
  }).filter(Boolean);
  
  return {
    companyName: nameInfo.name,
    companyNameConfidence: nameInfo.source ? nameInfo.confidence : undefined,
    domain: domainInfo.domain,
    domainConfidence: domainInfo.source ? "suggested" : undefined,
    website: domainInfo.domain ? `https://${domainInfo.domain}` : undefined,
    contacts: [{
      name: item.senderName || "",
      email: item.senderEmail,
      confidence: "suggested" as ConfidenceLevel,
    }],
    contextSummary: buildTaskNoteFromEmail(item),
    keyPoints,
    introSource: `Email from ${item.senderName || item.senderEmail}`,
    suggestedStage: inferStageFromContext(item) || undefined,
    suggestedTags: [],
    reason: introSignals.signals.length > 0 
      ? `Detected signals: ${introSignals.signals.join(", ")}`
      : "Manual pipeline company creation from email",
    sourceEmailId: item.id,
    confidence: {
      isIntroOrFollowup: introSignals.confidence,
      companyMatch: 0,
      domainInferred: domainInfo.confidence,
    },
  };
}
