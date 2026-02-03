export const READING_TOPIC_TAXONOMY = [
  'B2B Sales',
  'Vibe Coding',
  'Venture Trends',
  'Fintech',
  'SaaS Metrics',
  'AI/ML',
  'Developer Tools',
  'Product Strategy',
  'Go-to-Market',
  'Fundraising',
  'LP Relations',
  'Portfolio Ops',
  'Market Maps',
  'Regulatory/Compliance',
  'Infrastructure',
  'Growth/PLG',
  'Enterprise Sales',
  'Data & Analytics',
  'Payments',
  'Banking-as-a-Service',
] as const;

export type ReadingTopic = typeof READING_TOPIC_TAXONOMY[number] | string;
