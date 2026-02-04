// Shared email extraction logic using OpenAI
// Can be called from email-extract-structured (user triggered) or email-inbox-ingest (auto)

// Collapse long URLs to [link: domain]
export function collapseUrls(text: string): string {
  return text.replace(/https?:\/\/[^\s]{40,}/gi, (url) => {
    try {
      const domain = new URL(url).hostname.replace("www.", "");
      return `[link: ${domain}]`;
    } catch {
      return "[link]";
    }
  });
}

// Clean email text for extraction
export function cleanEmailForExtraction(text: string): string {
  let cleaned = text;
  
  // Collapse long URLs
  cleaned = collapseUrls(cleaned);
  
  // Remove excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  cleaned = cleaned.replace(/[ \t]+/g, " ");
  
  // Trim
  cleaned = cleaned.trim();
  
  return cleaned;
}

export interface ExtractionResult {
  summary: string;
  key_points: string[];
  next_step: { label: string; is_action_required: boolean };
  categories: string[];
  entities: Array<{ name: string; type: string; confidence: number }>;
  people: Array<{ name: string; email: string | null; confidence: number }>;
}

// Validate and normalize extraction result
export function validateExtraction(result: unknown): ExtractionResult {
  const r = result as Record<string, unknown>;
  
  // Validate summary
  const summary = typeof r.summary === "string" ? r.summary : "";
  
  // Validate key_points (3-7 items)
  let keyPoints = Array.isArray(r.key_points) 
    ? r.key_points.filter((p): p is string => typeof p === "string")
    : [];
  if (keyPoints.length < 3) keyPoints = keyPoints.concat(Array(3 - keyPoints.length).fill(""));
  if (keyPoints.length > 7) keyPoints = keyPoints.slice(0, 7);
  keyPoints = keyPoints.filter(p => p.trim().length > 0);
  
  // Validate next_step
  const nextStep = r.next_step as Record<string, unknown> | undefined;
  const validNextStep = {
    label: typeof nextStep?.label === "string" ? nextStep.label : "No action required",
    is_action_required: typeof nextStep?.is_action_required === "boolean" ? nextStep.is_action_required : false,
  };
  
  // Validate categories
  const validCategories = ["update", "request", "intro", "scheduling", "follow_up", "finance", "other"];
  const categories = Array.isArray(r.categories)
    ? r.categories.filter((c): c is string => typeof c === "string" && validCategories.includes(c))
    : [];
  
  // Validate entities
  const validEntityTypes = ["company", "bank", "fund", "product", "tool", "person", "other"];
  const entities = Array.isArray(r.entities)
    ? r.entities.map((e: unknown) => {
        const entity = e as Record<string, unknown>;
        return {
          name: typeof entity.name === "string" ? entity.name : "",
          type: typeof entity.type === "string" && validEntityTypes.includes(entity.type) ? entity.type : "other",
          confidence: typeof entity.confidence === "number" ? Math.max(0, Math.min(1, entity.confidence)) : 0.5,
        };
      }).filter(e => e.name.trim().length > 0)
    : [];
  
  // Validate people
  const people = Array.isArray(r.people)
    ? r.people.map((p: unknown) => {
        const person = p as Record<string, unknown>;
        return {
          name: typeof person.name === "string" ? person.name : "",
          email: typeof person.email === "string" ? person.email : null,
          confidence: typeof person.confidence === "number" ? Math.max(0, Math.min(1, person.confidence)) : 0.5,
        };
      }).filter(p => p.name.trim().length > 0)
    : [];
  
  return {
    summary,
    key_points: keyPoints,
    next_step: validNextStep,
    categories,
    entities,
    people,
  };
}

// OpenAI tool definition for extraction
export const extractionTool = {
  type: "function",
  function: {
    name: "extract_structured_summary",
    description: "Extract a structured summary from an email",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string", description: "1-2 sentence overview of the email" },
        key_points: {
          type: "array",
          items: { type: "string" },
          description: "3-7 key bullet points from the email",
        },
        next_step: {
          type: "object",
          properties: {
            label: { type: "string", description: "What action is required, if any" },
            is_action_required: { type: "boolean", description: "Whether action is required" },
          },
          required: ["label", "is_action_required"],
        },
        categories: {
          type: "array",
          items: {
            type: "string",
            enum: ["update", "request", "intro", "scheduling", "follow_up", "finance", "other"],
          },
          description: "Categories that apply to this email",
        },
        entities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              type: {
                type: "string",
                enum: ["company", "bank", "fund", "product", "tool", "person", "other"],
              },
              confidence: { type: "number", minimum: 0, maximum: 1 },
            },
            required: ["name", "type", "confidence"],
          },
          description: "Entities mentioned in the email",
        },
        people: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string", nullable: true },
              confidence: { type: "number", minimum: 0, maximum: 1 },
            },
            required: ["name", "confidence"],
          },
          description: "People mentioned in the email",
        },
      },
      required: ["summary", "key_points", "next_step", "categories", "entities", "people"],
    },
  },
};

export interface EmailContext {
  subject: string;
  fromName: string;
  fromEmail: string;
  toEmail: string | null;
  receivedAt: string;
  cleanedText: string;
}

// Call OpenAI for extraction
export async function extractStructuredSummary(
  openaiApiKey: string,
  context: EmailContext
): Promise<ExtractionResult> {
  const systemPrompt = `You are an assistant that extracts structured summaries from business emails.
Output must be valid JSON matching the schema exactly.
Do not include markdown or commentary.`;

  const userPrompt = `You are given a business email. Produce a structured extraction that helps the user quickly decide whether action is required.

Rules:
- Ignore email signatures, disclaimers, tracking footers, and repeated quoted threads.
- Do not copy raw URLs. If a link is important, mention only the domain in plain text.
- Keep summary factual and concise (1-2 sentences max).
- Key points should be short and specific. No more than 12 words each when possible.
- If the email requires no action, set next_step.is_action_required=false and next_step.label="No action required".
- Extract entities and people that are explicitly referenced or strongly implied.

Constraints:
- key_points: 3 to 7 items
- categories: choose from: ["update","request","intro","scheduling","follow_up","finance","other"]
- entities.type: choose from: ["company","bank","fund","product","tool","person","other"]
- confidence: number between 0 and 1

Email metadata:
Subject: ${context.subject}
From: ${context.fromName} <${context.fromEmail}>
To: ${context.toEmail || "unknown"}
Date: ${context.receivedAt}

Email content:
${context.cleanedText}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [extractionTool],
      tool_choice: { type: "function", function: { name: "extract_structured_summary" } },
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI API error:", response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

  if (!toolCall || toolCall.function.name !== "extract_structured_summary") {
    console.error("Unexpected OpenAI response:", JSON.stringify(data));
    throw new Error("OpenAI returned unexpected format");
  }

  let extractedData: unknown;
  try {
    extractedData = JSON.parse(toolCall.function.arguments);
  } catch (parseError) {
    console.error("Failed to parse tool call arguments:", toolCall.function.arguments);
    throw new Error("OpenAI returned invalid JSON");
  }

  return validateExtraction(extractedData);
}
