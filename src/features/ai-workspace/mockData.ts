/**
 * AI Workspace Mock Data - v1 Scaffolding
 * Hard-coded data for UBS Q4 email scenario.
 */

import type { AIWorkspaceContextItem, AIMessage, AIDraft } from "./types";

export const mockContextItems: AIWorkspaceContextItem[] = [
  {
    id: "ctx-1",
    type: "email",
    title: "UBS – Q4 data request",
    subtitle: "From: Sarah Chen • Dec 8, 2025",
    preview: "Hi team, following up on our earlier discussion regarding the Q4 portfolio data. We need the updated NAV figures and performance attribution by EOD Friday. Please confirm receipt and let me know if you have any questions.",
  },
  {
    id: "ctx-2",
    type: "task",
    title: "Send Q4 data package to UBS",
    subtitle: "Due: Dec 12 • High priority",
    preview: "Compile NAV figures, performance attribution, and risk metrics for Q4 review.",
  },
  {
    id: "ctx-3",
    type: "company",
    title: "UBS Asset Management",
    subtitle: "Portfolio Company • Active",
    preview: "Key contact: Sarah Chen (Portfolio Manager)",
  },
];

export const mockMessages: AIMessage[] = [
  {
    id: "msg-1",
    role: "user",
    content: "Help me draft a response to Sarah's email about the Q4 data request.",
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "msg-2",
    role: "assistant",
    content: "I've reviewed Sarah's email requesting Q4 portfolio data. Based on the context, I can help you draft a professional response that:\n\n1. Acknowledges receipt of the request\n2. Confirms the Friday EOD deadline\n3. Lists the specific deliverables (NAV figures, performance attribution)\n4. Offers to schedule a call if needed\n\nWould you like me to draft this response now?",
    createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
  },
  {
    id: "msg-3",
    role: "user",
    content: "Yes, please draft the response.",
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
  {
    id: "msg-4",
    role: "assistant",
    content: "I've created a draft response in the Drafts panel on the right. It confirms receipt, acknowledges the Friday deadline, and offers to schedule a brief call to walk through the data. Feel free to edit it before sending.",
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
];

export const mockDrafts: AIDraft[] = [
  {
    id: "draft-1",
    title: "Re: Q4 data request",
    preview: "Hi Sarah, Thank you for your email. I wanted to confirm receipt of your request for the Q4 portfolio data...",
    body: `Hi Sarah,

Thank you for your email. I wanted to confirm receipt of your request for the Q4 portfolio data.

We're currently finalizing the NAV figures and performance attribution analysis, and I'm confident we'll have everything ready for you by EOD Friday as requested.

The package will include:
• Updated NAV figures as of Q4 close
• Full performance attribution breakdown
• Risk metrics summary

Would it be helpful to schedule a brief call on Friday afternoon to walk through the data together? Happy to answer any questions in real-time.

Best regards`,
  },
];
