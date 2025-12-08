import type { InboxItem } from "@/types/inbox";

const TIME_SENSITIVE_KEYWORDS = [
  'today', 'tomorrow', 'urgent', 'call', 'deadline', 'asap', 
  'meeting', 'schedule', 'reminder', 'follow up', 'followup'
];

function hasTimeSensitiveKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return TIME_SENSITIVE_KEYWORDS.some(keyword => lower.includes(keyword));
}

function generateReason(item: InboxItem): string {
  if (!item.isRead) {
    if (item.relatedCompanyId) {
      return "Unread from a tracked company";
    }
    if (hasTimeSensitiveKeyword(item.subject)) {
      return "Unread with time-sensitive content";
    }
    return "Unread message needs attention";
  }
  if (hasTimeSensitiveKeyword(item.subject)) {
    return "Contains time-sensitive keywords";
  }
  if (item.relatedCompanyId) {
    return "From a tracked company";
  }
  return "Recent activity";
}

function calculateScore(item: InboxItem): number {
  let score = 0;
  
  // Unread is highest priority
  if (!item.isRead) score += 10;
  
  // Related to portfolio/pipeline company
  if (item.relatedCompanyId) score += 5;
  
  // Time-sensitive keywords
  if (hasTimeSensitiveKeyword(item.subject)) score += 3;
  
  // Recency bonus (last 24 hours)
  const hoursSinceReceived = (Date.now() - new Date(item.receivedAt).getTime()) / (1000 * 60 * 60);
  if (hoursSinceReceived < 24) score += 2;
  if (hoursSinceReceived < 4) score += 2;
  
  return score;
}

export interface ProposedAction {
  item: InboxItem;
  reason: string;
  score: number;
}

export function getProposedInboxActions(
  items: InboxItem[],
  maxItems = 5
): ProposedAction[] {
  const scored = items
    .filter(item => !item.isDeleted && !item.isResolved)
    .map(item => ({
      item,
      score: calculateScore(item),
      reason: generateReason(item),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems);

  return scored;
}

// Classification helpers
export function isActionRequired(item: InboxItem): boolean {
  return !item.isRead && !item.isDeleted && !item.isResolved;
}

export function isWaitingOn(item: InboxItem): boolean {
  return item.isRead && !item.isResolved && !item.isDeleted;
}

export function getLowPriorityItems(items: InboxItem[], daysThreshold = 14): InboxItem[] {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);
  
  return items.filter(item => 
    new Date(item.receivedAt) < thresholdDate && 
    item.isRead &&
    !item.isDeleted
  );
}

export function getInboxCounts(items: InboxItem[], archivedItems: InboxItem[]) {
  return {
    unread: items.filter(i => !i.isRead).length,
    actionRequired: items.filter(isActionRequired).length,
    waitingOn: items.filter(isWaitingOn).length,
    archived: archivedItems.length,
  };
}
