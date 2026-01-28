import type { PriorityItem, PrioritySourceType, PriorityIconType } from "@/types/priority";

export type PriorityViewFilter = 
  | "all" 
  | "overdue" 
  | "due-today" 
  | "due-soon" 
  | "tasks" 
  | "inbox" 
  | "calendar";

export interface PriorityCounts {
  all: number;
  overdue: number;
  dueToday: number;
  dueSoon: number;
  tasks: number;
  inbox: number;
  calendar: number;
}

export interface ProposedPriorityAction {
  item: PriorityItem;
  reason: string;
}

export function getPriorityCounts(items: PriorityItem[]): PriorityCounts {
  return {
    all: items.length,
    overdue: items.filter(i => i.iconType === "overdue").length,
    dueToday: items.filter(i => i.iconType === "due-today").length,
    dueSoon: items.filter(i => i.iconType === "due-soon").length,
    tasks: items.filter(i => i.sourceType === "task").length,
    inbox: items.filter(i => i.sourceType === "inbox").length,
    calendar: items.filter(i => i.sourceType === "calendar_event").length,
  };
}

export function getProposedPriorityActions(items: PriorityItem[], limit: number = 4): ProposedPriorityAction[] {
  // Sort by priority score and take top items
  const sorted = [...items]
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, limit);

  return sorted.map(item => ({
    item,
    reason: getActionReason(item),
  }));
}

function getActionReason(item: PriorityItem): string {
  if (item.iconType === "overdue") return "Overdue - needs immediate action";
  if (item.iconType === "due-today") return "Due today";
  if (item.iconType === "due-soon") return "Due soon";
  if (item.iconType === "unread-email") return "Unread - may need response";
  if (item.iconType === "upcoming-event") return "Upcoming event";
  if (item.iconType === "stale-company") return "No recent interaction";
  if (item.iconType === "high-importance") return "High priority";
  return "Needs attention";
}

export function getSnoozeableItems(items: PriorityItem[]): PriorityItem[] {
  return items.filter(i => i.sourceType === "task" || i.sourceType === "inbox");
}

export function filterPriorityItems(
  items: PriorityItem[], 
  filter: PriorityViewFilter
): PriorityItem[] {
  if (filter === "all") return items;
  
  switch (filter) {
    case "overdue":
      return items.filter(i => i.iconType === "overdue");
    case "due-today":
      return items.filter(i => i.iconType === "due-today");
    case "due-soon":
      return items.filter(i => i.iconType === "due-soon");
    case "tasks":
      return items.filter(i => i.sourceType === "task");
    case "inbox":
      return items.filter(i => i.sourceType === "inbox");
    case "calendar":
      return items.filter(i => i.sourceType === "calendar_event");
    default:
      return items;
  }
}
