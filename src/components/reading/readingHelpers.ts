import { ReadingItem } from '@/types/readingItem';
import { isWithinInterval, subDays, startOfDay, endOfDay, startOfWeek } from 'date-fns';

export type ReadingPrimaryView = 
  | 'queue' 
  | 'today' 
  | 'thisWeek' 
  | 'favorites' 
  | 'read' 
  | 'archived';

export interface ReadingFilter {
  primaryView: ReadingPrimaryView;
  projects: string[];
}

export interface ReadingCounts {
  queue: number;
  today: number;
  thisWeek: number;
  favorites: number;
  read: number;
  archived: number;
}

export interface ProposedReadingAction {
  item: ReadingItem;
  reason: string;
}

// Calculate counts for each view
export function getReadingCounts(items: ReadingItem[]): ReadingCounts {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  return {
    queue: items.filter(i => !i.isRead && !i.isArchived).length,
    today: items.filter(i => {
      if (i.isRead || i.isArchived) return false;
      const createdAt = i.created_at ? new Date(i.created_at) : null;
      return createdAt && isWithinInterval(createdAt, { start: subDays(now, 2), end: now });
    }).length,
    thisWeek: items.filter(i => {
      if (i.isRead || i.isArchived) return false;
      const createdAt = i.created_at ? new Date(i.created_at) : null;
      return createdAt && createdAt >= weekStart;
    }).length,
    favorites: items.filter(i => i.isFlagged && !i.isArchived).length,
    read: items.filter(i => i.isRead && !i.isArchived).length,
    archived: items.filter(i => i.isArchived).length,
  };
}

// Get suggested reading items
export function getSuggestedReading(items: ReadingItem[], limit: number = 4): ProposedReadingAction[] {
  const candidates = items.filter(i => !i.isRead && !i.isArchived);
  
  const sorted = [...candidates].sort((a, b) => {
    // 1. Flagged items first
    if (a.isFlagged !== b.isFlagged) return a.isFlagged ? -1 : 1;
    // 2. Most recently added next
    const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bDate - aDate;
  });

  return sorted.slice(0, limit).map(item => ({
    item,
    reason: item.isFlagged 
      ? 'Flagged for priority reading' 
      : 'Recently added to your queue'
  }));
}

// Apply filters to reading items
export function applyReadingFilter(
  items: ReadingItem[], 
  filter: ReadingFilter,
  searchQuery: string = ''
): ReadingItem[] {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  let result = items;

  // Apply primary view filter
  switch (filter.primaryView) {
    case 'queue':
      result = result.filter(i => !i.isRead && !i.isArchived);
      break;
    case 'today':
      result = result.filter(i => {
        if (i.isRead || i.isArchived) return false;
        const createdAt = i.created_at ? new Date(i.created_at) : null;
        return createdAt && isWithinInterval(createdAt, { start: subDays(now, 2), end: now });
      });
      break;
    case 'thisWeek':
      result = result.filter(i => {
        if (i.isRead || i.isArchived) return false;
        const createdAt = i.created_at ? new Date(i.created_at) : null;
        return createdAt && createdAt >= weekStart;
      });
      break;
    case 'favorites':
      // Include ALL favorites (both read and unread), not archived
      result = result.filter(i => i.isFlagged && !i.isArchived);
      break;
    case 'read':
      result = result.filter(i => i.isRead && !i.isArchived);
      break;
    case 'archived':
      result = result.filter(i => i.isArchived);
      break;
  }

  // Apply project filter
  if (filter.projects.length > 0) {
    result = result.filter(i => i.project_id && filter.projects.includes(i.project_id));
  }

  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    result = result.filter(i => 
      i.title.toLowerCase().includes(query) ||
      (i.description && i.description.toLowerCase().includes(query)) ||
      i.url.toLowerCase().includes(query) ||
      (i.hostname && i.hostname.toLowerCase().includes(query))
    );
  }

  // Apply view-specific sorting
  if (['queue', 'today', 'thisWeek'].includes(filter.primaryView)) {
    // Sort: favorites first, then by recency
    result = [...result].sort((a, b) => {
      if (a.isFlagged !== b.isFlagged) return a.isFlagged ? -1 : 1;
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    });
  } else if (filter.primaryView === 'favorites') {
    // Sort: unread favorites first, then read favorites by readAt
    result = [...result].sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      if (a.isRead && b.isRead) {
        const aReadAt = a.readAt ? new Date(a.readAt).getTime() : 0;
        const bReadAt = b.readAt ? new Date(b.readAt).getTime() : 0;
        return bReadAt - aReadAt;
      }
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    });
  } else if (filter.primaryView === 'read') {
    // Sort by read_at descending, fallback to created_at
    result = [...result].sort((a, b) => {
      const aDate = a.readAt ? new Date(a.readAt).getTime() : 
                    (a.created_at ? new Date(a.created_at).getTime() : 0);
      const bDate = b.readAt ? new Date(b.readAt).getTime() : 
                    (b.created_at ? new Date(b.created_at).getTime() : 0);
      return bDate - aDate;
    });
  }

  return result;
}

// Calculate estimated reading time
export function getEstimatedReadingTime(items: ReadingItem[]): string {
  const unreadCount = items.filter(i => !i.isRead && !i.isArchived).length;
  const estimatedMinutes = unreadCount * 5; // 5 min per article heuristic
  
  if (estimatedMinutes === 0) return '0 min';
  if (estimatedMinutes >= 60) {
    const hours = Math.round(estimatedMinutes / 60);
    return `~${hours}h`;
  }
  return `~${estimatedMinutes} min`;
}

// Get items added this week
export function getAddedThisWeekCount(items: ReadingItem[]): number {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  return items.filter(i => {
    const createdAt = i.created_at ? new Date(i.created_at) : null;
    return createdAt && createdAt >= weekStart;
  }).length;
}
