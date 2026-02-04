// inbox-suggest-v2: VC-Intent Aware Inbox Suggestions
// Uses structured suggestion types and candidate company retrieval
// Forward-aware: uses display_* fields for effective sender/subject/body

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const GENERIC_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com",
  "yahoo.com", "ymail.com",
  "outlook.com", "hotmail.com", "live.com", "msn.com",
  "icloud.com", "me.com", "mac.com",
  "aol.com",
  "protonmail.com", "proton.me",
  "zoho.com", "mail.com", "fastmail.com",
]);

function isGenericEmailDomain(domain: string | null): boolean {
  if (!domain) return false;
  return GENERIC_EMAIL_DOMAINS.has(domain.toLowerCase());
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Check if two domains are the same or one is a subdomain of the other.
 * Returns true only if:
 * - a === b, OR
 * - a.endsWith("." + b), OR
 * - b.endsWith("." + a)
 * 
 * This prevents "sandboxwealth.com" from matching "wealth.com" (they're different companies).
 */
function domainsAreSameOrSubdomain(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const aNorm = a.toLowerCase();
  const bNorm = b.toLowerCase();
  if (aNorm === bNorm) return true;
  if (aNorm.endsWith("." + bNorm)) return true;
  if (bNorm.endsWith("." + aNorm)) return true;
  return false;
}

const EMAIL_INTENTS = [
  "intro_first_touch",
  "pipeline_follow_up",
  "portfolio_update",
  "intro_request",
  "scheduling",
  "personal_todo",
  "fyi_informational",
] as const;

const SUGGESTION_TYPES = [
  "LINK_COMPANY",
  "CREATE_PIPELINE_COMPANY",
  "CREATE_FOLLOW_UP_TASK",
  "CREATE_PERSONAL_TASK",
  "CREATE_INTRO_TASK",
  "CREATE_WAITING_ON",
  "SET_STATUS",
  "EXTRACT_UPDATE_HIGHLIGHTS",
] as const;

interface CandidateCompany {
  id: string;
  name: string;
  type: "portfolio" | "pipeline";
  primary_domain: string | null;
  match_score: number;
  match_reason: "domain" | "name_mention" | "prior_link" | "sender_history";
}

function extractDomainFromEmail(email: string): string | null {
  if (!email) return null;
  const parts = email.toLowerCase().split("@");
  if (parts.length !== 2) return null;
  return parts[1];
}

function normalizeDomain(domain: string | null): string | null {
  if (!domain) return null;
  return domain.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
}

async function fetchCandidateCompanies(
  supabase: ReturnType<typeof createClient>,
  effectiveSenderEmail: string,
  subject: string,
  bodySnippet: string
): Promise<CandidateCompany[]> {
  // Fetch all companies
  const [portfolioResult, pipelineResult] = await Promise.all([
    supabase.from("companies").select("id, name, primary_domain").order("name"),
    supabase.from("pipeline_companies").select("id, company_name, primary_domain").order("company_name"),
  ]);

  const companies: Array<{
    id: string;
    name: string;
    primary_domain: string | null;
    type: "portfolio" | "pipeline";
  }> = [];

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

  const senderDomain = extractDomainFromEmail(effectiveSenderEmail);
  const normalizedSenderDomain = normalizeDomain(senderDomain);
  const candidateMap = new Map<string, CandidateCompany>();

  // Domain matches (score: 100) - support exact match or true subdomain
  if (normalizedSenderDomain) {
    for (const company of companies) {
      const companyDomain = normalizeDomain(company.primary_domain);
      if (companyDomain && domainsAreSameOrSubdomain(normalizedSenderDomain, companyDomain)) {
        candidateMap.set(company.id, {
          id: company.id,
          name: company.name,
          type: company.type,
          primary_domain: company.primary_domain,
          match_score: 100,
          match_reason: "domain",
        });
      }
    }
  }

  // Prior links from same sender - now forward-aware
  // Select display_from_email in addition to from_email
  const { data: priorItems } = await supabase
    .from("inbox_items")
    .select("from_email, display_from_email, related_company_id")
    .not("related_company_id", "is", null)
    .limit(50);

  if (priorItems) {
    for (const item of priorItems) {
      if (item.related_company_id) {
        const company = companies.find((c) => c.id === item.related_company_id);
        if (!company) continue;

        // Use effective email from prior item (forward-aware)
        const priorEffectiveEmail = (item.display_from_email ?? item.from_email).toLowerCase();
        const priorEffectiveDomain = extractDomainFromEmail(priorEffectiveEmail);
        const normalizedPriorDomain = normalizeDomain(priorEffectiveDomain);
        
        if (priorEffectiveEmail === effectiveSenderEmail.toLowerCase()) {
          // Exact sender match
          if (!candidateMap.has(company.id)) {
            candidateMap.set(company.id, {
              id: company.id,
              name: company.name,
              type: company.type,
              primary_domain: company.primary_domain,
              match_score: 90,
              match_reason: "prior_link",
            });
          }
        } else if (
          normalizedPriorDomain &&
          normalizedSenderDomain &&
          domainsAreSameOrSubdomain(normalizedPriorDomain, normalizedSenderDomain) &&
          !candidateMap.has(company.id)
        ) {
          // Same domain history (using proper subdomain check)
          candidateMap.set(company.id, {
            id: company.id,
            name: company.name,
            type: company.type,
            primary_domain: company.primary_domain,
            match_score: 50,
            match_reason: "sender_history",
          });
        }
      }
    }
  }

  // Name mentions in subject/body - with word boundary check
  const searchText = `${subject} ${bodySnippet.slice(0, 500)}`.toLowerCase();
  
  for (const company of companies) {
    if (candidateMap.has(company.id)) continue;
    
    const companyNameLower = company.name.toLowerCase().trim();
    
    // Skip very short names (high false positive risk)
    if (companyNameLower.length < 4) continue;
    
    // Use word boundary regex to prevent partial matches
    // "Wealth" should not match "Sandbox Wealth" unless it's the complete word
    const wordBoundaryPattern = new RegExp(`\\b${escapeRegex(companyNameLower)}\\b`, "i");
    
    if (wordBoundaryPattern.test(searchText)) {
      // Additional check: if sender has a professional domain, verify it doesn't conflict
      const senderDomainNormalized = normalizeDomain(senderDomain);
      const companyDomainNormalized = normalizeDomain(company.primary_domain);
      
      // If both have domains and they are NOT the same or subdomain, skip this match
      // (prevents "Wealth" from matching email about "Sandbox Wealth")
      if (
        senderDomainNormalized && 
        !isGenericEmailDomain(senderDomainNormalized) &&
        companyDomainNormalized && 
        !domainsAreSameOrSubdomain(senderDomainNormalized, companyDomainNormalized)
      ) {
        // Sender domain is professional but different from company domain
        // This is likely a different company (sandboxwealth.com vs wealth.com)
        console.log(`Skipping name match: "${company.name}" (${companyDomainNormalized}) for sender domain ${senderDomainNormalized}`);
        continue;
      }
      
      candidateMap.set(company.id, {
        id: company.id,
        name: company.name,
        type: company.type,
        primary_domain: company.primary_domain,
        match_score: 75,
        match_reason: "name_mention",
      });
    }
  }

  // Sort by score and return top 8
  return Array.from(candidateMap.values())
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 8);
}

function buildSystemPrompt(): string {
  return `You are an AI assistant for a venture capital investor managing deal flow, portfolio companies, and professional relationships.

Your task is to analyze an email and classify its intent, then suggest appropriate actions.

## Email Intent Classification

Classify the email into one of these intents:
- intro_first_touch: First contact from a new company or warm intro (prioritize this for introduction emails)
- pipeline_follow_up: Ongoing deal discussion with a pipeline company
- portfolio_update: Update from a portfolio company (metrics, news, asks)
- intro_request: Someone asking for an introduction
- scheduling: Meeting scheduling, calendar logistics
- personal_todo: Self-sent reminder or personal task
- fyi_informational: Informational only, no action needed

## Suggestion Types

Suggest actions using these types:
- LINK_COMPANY: Link email to an existing company (ONLY use company_id from provided candidates)
- CREATE_PIPELINE_COMPANY: Create new pipeline company (when no match exists for new deal intro)
- CREATE_FOLLOW_UP_TASK: Create a follow-up task (can link to company)
- CREATE_PERSONAL_TASK: Create personal task (no company link)
- CREATE_INTRO_TASK: Create task to make an introduction
- CREATE_WAITING_ON: Track an obligation someone else owes you (e.g., they promised to send materials, schedule a meeting, follow up)
- SET_STATUS: Update pipeline stage
- EXTRACT_UPDATE_HIGHLIGHTS: Extract key metrics/updates from portfolio email

## CREATE_PIPELINE_COMPANY Rules

When suggesting CREATE_PIPELINE_COMPANY (for intro emails with no existing company match):
- This should be HIGH priority when subject contains "Intro", "Introduction", "Meet", "Connecting you"
- IMPORTANT: If candidate_companies contains a partial match (e.g., "Wealth" for "Sandbox Wealth"), 
  verify the domains match. If sender domain differs from candidate domain, suggest CREATE_PIPELINE_COMPANY instead of LINK_COMPANY.
- Extract company details and include in metadata:
  - extracted_company_name: The company name (from signature, subject line, or email body)
  - extracted_domain: Domain from sender email or mentioned URLs
  - primary_contact_name: Name of the founder/sender
  - primary_contact_email: Email of the founder/sender
  - description_oneliner: A brief AI-generated one-liner about what the company does
  - notes_summary: Context about the intro (who made it, any traction/background mentioned, relevant links)
  - suggested_tags: Array of relevant tags (e.g., "fintech", "AI", "healthcare", "seed")
  - intro_source: Who made the introduction (e.g., "Warm Intro from John Smith")

## CREATE_WAITING_ON Rules

When suggesting CREATE_WAITING_ON (for emails where someone promises to do something for you):
- Use when the sender explicitly commits to an action: "I'll send you...", "We'll get back to you...", "Let me schedule..."
- Include in metadata:
  - commitment_title: Short title (e.g., "Send deck by Friday")
  - commitment_content: Full description of what was promised
  - person_name: Name of the person who made the promise
  - expected_by_hint: When they said they'd do it (e.g., "end of week", "tomorrow", null if unspecified)
  - context: Brief context about the conversation
- Do NOT suggest for vague language like "we should catch up" or "let's connect sometime"
- This creates an obligation tracker, not a task - use for tracking what others owe you

## Quality Rules

1. For portfolio updates: Suggest LINK_COMPANY + EXTRACT_UPDATE_HIGHLIGHTS, NOT individual tasks for each metric
2. For intro/first touch with no company match: Suggest CREATE_PIPELINE_COMPANY with full metadata
3. For intro/first touch with existing company match: Suggest LINK_COMPANY instead
4. For follow-ups: Suggest ONE crisp CREATE_FOLLOW_UP_TASK with context
5. For personal/self-sent: Suggest CREATE_PERSONAL_TASK only
6. For FYI emails: Return minimal or no suggestions
7. NEVER hallucinate company IDs - only use IDs from the candidate_companies list
8. Max 5 suggestions, ordered by usefulness
9. CREATE_PIPELINE_COMPANY should be first suggestion when intent is intro_first_touch and no candidates match
10. CRITICAL: Do not suggest LINK_COMPANY if the sender's email domain differs from the candidate company's domain.
    Example: Email from ray@sandboxwealth.com should NOT link to "Wealth" (wealth.com) - these are different companies.
    In such cases, suggest CREATE_PIPELINE_COMPANY with the correct company name from the email.
11. When using LINK_COMPANY with a company_id from candidate_companies, use the exact company name and type from that candidate.

## Response Format

You must call the analyze_email function with your analysis.`;
}

function buildToolSchema() {
  return {
    type: "function",
    function: {
      name: "analyze_email",
      description: "Analyze an email and return structured intent and suggestions",
      parameters: {
        type: "object",
        properties: {
          intent: {
            type: "string",
            enum: EMAIL_INTENTS,
            description: "Classified email intent",
          },
          intent_confidence: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "Confidence in intent classification",
          },
          asks: {
            type: "array",
            items: { type: "string" },
            description: "Extracted asks or requests from the email",
          },
          entities: {
            type: "array",
            items: { type: "string" },
            description: "Mentioned entities (people, companies)",
          },
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: SUGGESTION_TYPES,
                },
                title: {
                  type: "string",
                  description: "Short action title",
                },
                confidence: {
                  type: "string",
                  enum: ["low", "medium", "high"],
                },
                effort_bucket: {
                  type: "string",
                  enum: ["quick", "medium", "long"],
                },
                effort_minutes: {
                  type: "number",
                },
                rationale: {
                  type: "string",
                  description: "Brief explanation for this suggestion",
                },
                company_id: {
                  type: "string",
                  nullable: true,
                  description: "Company ID from candidate_companies (or null)",
                },
                company_name: {
                  type: "string",
                  nullable: true,
                },
                company_type: {
                  type: "string",
                  enum: ["portfolio", "pipeline"],
                  nullable: true,
                },
                due_hint: {
                  type: "string",
                  nullable: true,
                  description: "Due date hint (e.g., 'tomorrow', 'end of week')",
                },
                metadata: {
                  type: "object",
                  nullable: true,
                  description: "Additional data for specific suggestion types. For CREATE_PIPELINE_COMPANY: extracted_company_name, extracted_domain, primary_contact_name, primary_contact_email, description_oneliner, notes_summary, suggested_tags, intro_source. For CREATE_WAITING_ON: commitment_title, commitment_content, person_name, expected_by_hint, context",
                  properties: {
                    extracted_company_name: { type: "string" },
                    extracted_domain: { type: "string", nullable: true },
                    primary_contact_name: { type: "string" },
                    primary_contact_email: { type: "string" },
                    description_oneliner: { type: "string" },
                    notes_summary: { type: "string" },
                    suggested_tags: { type: "array", items: { type: "string" } },
                    intro_source: { type: "string" },
                    commitment_title: { type: "string" },
                    commitment_content: { type: "string" },
                    person_name: { type: "string" },
                    expected_by_hint: { type: "string", nullable: true },
                    context: { type: "string" },
                  },
                },
              },
              required: ["type", "title", "confidence", "effort_bucket", "effort_minutes", "rationale"],
              additionalProperties: false,
            },
            maxItems: 5,
          },
        },
        required: ["intent", "intent_confidence", "asks", "entities", "suggestions"],
        additionalProperties: false,
      },
    },
  };
}

async function callOpenAI(
  effectiveSubject: string,
  effectiveBody: string,
  effectiveSenderEmail: string,
  effectiveSenderName: string | null,
  candidates: CandidateCompany[]
): Promise<{
  intent: string;
  intent_confidence: string;
  asks: string[];
  entities: string[];
  suggestions: Array<{
    type: string;
    title: string;
    confidence: string;
    effort_bucket: string;
    effort_minutes: number;
    rationale: string;
    company_id?: string | null;
    company_name?: string | null;
    company_type?: string | null;
    due_hint?: string | null;
    metadata?: Record<string, unknown>;
  }>;
}> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  // Enhanced candidate list with domain and match context
  const candidateList = candidates.length > 0
    ? candidates.map((c) => 
        `- ID: ${c.id}, Name: ${c.name}, Type: ${c.type}, Domain: ${c.primary_domain ?? "null"}, Match: ${c.match_reason} (score: ${c.match_score})`
      ).join("\n")
    : "No candidate companies found.";

  const userMessage = `
## Email Details

**From:** ${effectiveSenderName ? `${effectiveSenderName} <${effectiveSenderEmail}>` : effectiveSenderEmail}
**Subject:** ${effectiveSubject}

**Body:**
${effectiveBody.slice(0, 1500)}

## Candidate Companies (use these IDs only for LINK_COMPANY)

${candidateList}

Analyze this email and provide structured suggestions.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: userMessage },
      ],
      tools: [buildToolSchema()],
      tool_choice: { type: "function", function: { name: "analyze_email" } },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI API error:", response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

  if (!toolCall || toolCall.function.name !== "analyze_email") {
    throw new Error("Invalid OpenAI response structure");
  }

  return JSON.parse(toolCall.function.arguments);
}

/**
 * Validate company references and normalize company_name/company_type from candidates.
 * This prevents the AI from hallucinating incorrect names or types.
 */
function validateCompanyReferences(
  analysis: Awaited<ReturnType<typeof callOpenAI>>,
  candidates: CandidateCompany[]
): typeof analysis {
  // Build a map for quick lookup
  const candidateMap = new Map<string, CandidateCompany>();
  for (const c of candidates) {
    candidateMap.set(c.id, c);
  }

  for (const suggestion of analysis.suggestions) {
    if (suggestion.company_id) {
      const candidate = candidateMap.get(suggestion.company_id);
      if (candidate) {
        // Normalize name and type from the actual candidate record
        suggestion.company_name = candidate.name;
        suggestion.company_type = candidate.type;
      } else {
        // Invalid company_id, clear the references
        console.warn(`Invalid company_id ${suggestion.company_id}, removing`);
        suggestion.company_id = null;
        suggestion.company_name = null;
        suggestion.company_type = null;
      }
    }
  }

  return analysis;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { inbox_item_id, force = false } = await req.json();
    if (!inbox_item_id) {
      return new Response(JSON.stringify({ error: "inbox_item_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing inbox-suggest-v2 for item: ${inbox_item_id}, force: ${force}`);

    // Check cache
    if (!force) {
      const { data: cached } = await supabase
        .from("inbox_suggestions")
        .select("*")
        .eq("inbox_item_id", inbox_item_id)
        .eq("version", 2)
        .maybeSingle();

      if (cached?.updated_at) {
        const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
        if (cacheAge < CACHE_TTL_MS) {
          console.log("Returning cached suggestions");
          return new Response(
            JSON.stringify({
              intent: cached.intent,
              intent_confidence: "high",
              asks: [],
              entities: [],
              suggestions: cached.suggestions || [],
              candidate_companies: cached.candidate_companies || [],
              generated_at: cached.generated_at,
              version: 2,
              cached: true,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Fetch inbox item - now including display/cleaned fields for forward-awareness
    const { data: item, error: itemError } = await supabase
      .from("inbox_items")
      .select(`
        id, subject, text_body, from_email, from_name,
        display_from_email, display_from_name, display_subject,
        cleaned_text, thread_clean_text
      `)
      .eq("id", inbox_item_id)
      .single();

    if (itemError || !item) {
      return new Response(JSON.stringify({ error: "Inbox item not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Compute effective values (forward-aware)
    const effectiveFromEmail = item.display_from_email ?? item.from_email;
    const effectiveFromName = item.display_from_name ?? item.from_name;
    const effectiveSubject = item.display_subject ?? item.subject;
    const effectiveBody = item.thread_clean_text ?? item.cleaned_text ?? item.text_body ?? "";

    console.log(`Effective sender: ${effectiveFromName ? `${effectiveFromName} <${effectiveFromEmail}>` : effectiveFromEmail}`);
    console.log(`Effective subject: ${effectiveSubject}`);

    // Get candidate companies using effective sender
    const candidates = await fetchCandidateCompanies(
      supabase,
      effectiveFromEmail,
      effectiveSubject,
      effectiveBody
    );

    console.log(`Found ${candidates.length} candidate companies`);
    if (candidates.length > 0) {
      console.log(`Top candidates: ${candidates.slice(0, 3).map(c => `${c.name} (${c.match_reason}:${c.match_score})`).join(", ")}`);
    }

    // Call OpenAI with effective values
    const analysis = await callOpenAI(
      effectiveSubject,
      effectiveBody,
      effectiveFromEmail,
      effectiveFromName,
      candidates
    );

    // Validate company references and normalize from candidates
    const validated = validateCompanyReferences(analysis, candidates);

    // Add IDs to suggestions
    const suggestionsWithIds = validated.suggestions.map((s, i) => ({
      ...s,
      id: `${inbox_item_id}-${i}-${Date.now()}`,
    }));

    const generatedAt = new Date().toISOString();

    // Upsert to database
    const { error: upsertError } = await supabase
      .from("inbox_suggestions")
      .upsert(
        {
          inbox_item_id,
          suggestions: suggestionsWithIds,
          intent: validated.intent,
          version: 2,
          candidate_companies: candidates,
          source: "ai",
          generated_at: generatedAt,
          updated_at: generatedAt,
        },
        { onConflict: "inbox_item_id" }
      );

    if (upsertError) {
      console.error("Error upserting suggestions:", upsertError);
    }

    const response = {
      intent: validated.intent,
      intent_confidence: validated.intent_confidence,
      asks: validated.asks,
      entities: validated.entities,
      suggestions: suggestionsWithIds,
      candidate_companies: candidates,
      generated_at: generatedAt,
      version: 2,
    };

    console.log(`Generated ${suggestionsWithIds.length} suggestions with intent: ${validated.intent}`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("inbox-suggest-v2 error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
