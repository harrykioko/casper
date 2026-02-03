import Fuse, { IFuseOptions } from 'fuse.js';
import { ReadingItem, ProcessingStatus } from '@/types/readingItem';
import { startOfWeek } from 'date-fns';

// Content type display names for search matching
const CONTENT_TYPE_SEARCH_TERMS: Record<string, string[]> = {
  article: ['article', 'articles'],
  x_post: ['x post', 'x posts', 'tweet', 'tweets', 'twitter'],
  blog_post: ['blog', 'blogs', 'blog post', 'blog posts'],
  newsletter: ['newsletter', 'newsletters'],
  tool: ['tool', 'tools', 'product', 'products'],
};

// Fuse.js configuration for fuzzy search
const FUSE_OPTIONS: IFuseOptions<ReadingItem> = {
  keys: [
    { name: 'title', weight: 0.3 },
    { name: 'oneLiner', weight: 0.25 },
    { name: 'topics', weight: 0.2 },
    { name: 'description', weight: 0.1 },
    { name: 'hostname', weight: 0.1 },
    { name: 'url', weight: 0.05 },
  ],
  threshold: 0.4,
  ignoreLocation: true,
  useExtendedSearch: false,
};

export type ReadingPrimaryView =
  | 'library'
  | 'inbox'
  | 'signals'
  | 'read'
  | 'archived';

export interface ReadingFilter {
  primaryView: ReadingPrimaryView;
  projects: string[];
  contentTypes: string[];
}

export interface ReadingCounts {
  upNext: number;
  queue: number;
  signals: number;
  inbox: number;
  read: number;
  archived: number;
}

export interface ProposedReadingAction {
  item: ReadingItem;
  reason: string;
}

// Calculate counts for each status
export function getReadingCounts(items: ReadingItem[]): ReadingCounts {
  return {
    upNext: items.filter(i => i.processingStatus === 'up_next').length,
    queue: items.filter(i => i.processingStatus === 'queued').length,
    signals: items.filter(i => i.processingStatus === 'signal').length,
    inbox: items.filter(i => i.processingStatus === 'unprocessed').length,
    read: items.filter(i => i.processingStatus === 'read').length,
    archived: items.filter(i => i.processingStatus === 'archived').length,
  };
}

// Get items for the Up Next section
export function getUpNextItems(items: ReadingItem[]): ReadingItem[] {
  const upNext = items.filter(i => i.processingStatus === 'up_next');

  return [...upNext].sort((a, b) => {
    // Today bucket first, then this_week, then no bucket
    const bucketOrder: Record<string, number> = { today: 0, this_week: 1 };
    const aBucket = a.readLaterBucket ? (bucketOrder[a.readLaterBucket] ?? 2) : 2;
    const bBucket = b.readLaterBucket ? (bucketOrder[b.readLaterBucket] ?? 2) : 2;
    if (aBucket !== bBucket) return aBucket - bBucket;

    // Then by priority
    const priorityOrder: Record<string, number> = { high: 0, normal: 1, low: 2 };
    const aPri = priorityOrder[a.priority] ?? 1;
    const bPri = priorityOrder[b.priority] ?? 1;
    if (aPri !== bPri) return aPri - bPri;

    // Then by recency
    const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bDate - aDate;
  });
}

// Get items for the Queue section
export function getQueueItems(items: ReadingItem[]): ReadingItem[] {
  const queued = items.filter(i => i.processingStatus === 'queued');

  return [...queued].sort((a, b) => {
    // Priority first
    const priorityOrder: Record<string, number> = { high: 0, normal: 1, low: 2 };
    const aPri = priorityOrder[a.priority] ?? 1;
    const bPri = priorityOrder[b.priority] ?? 1;
    if (aPri !== bPri) return aPri - bPri;

    // Then recency
    const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bDate - aDate;
  });
}

// Apply filters to reading items
export function applyReadingFilter(
  items: ReadingItem[],
  filter: ReadingFilter,
  searchQuery: string = ''
): ReadingItem[] {
  let result = items;

  // Apply primary view filter
  switch (filter.primaryView) {
    case 'library':
      result = result.filter(i => i.processingStatus === 'up_next' || i.processingStatus === 'queued');
      break;
    case 'inbox':
      result = result.filter(i => i.processingStatus === 'unprocessed');
      break;
    case 'signals':
      result = result.filter(i => i.processingStatus === 'signal');
      break;
    case 'read':
      result = result.filter(i => i.processingStatus === 'read');
      break;
    case 'archived':
      result = result.filter(i => i.processingStatus === 'archived');
      break;
  }

  // Apply project filter
  if (filter.projects.length > 0) {
    result = result.filter(i => i.project_id && filter.projects.includes(i.project_id));
  }

  // Apply content type filter
  if (filter.contentTypes.length > 0) {
    result = result.filter(i => i.contentType && filter.contentTypes.includes(i.contentType));
  }

  // Apply search filter (fuzzy with fuse.js)
  if (searchQuery) {
    const query = searchQuery.toLowerCase().trim();

    // Check if query matches a content type name — filter by type directly
    const matchedContentTypes: string[] = [];
    for (const [type, terms] of Object.entries(CONTENT_TYPE_SEARCH_TERMS)) {
      if (terms.some(t => t.includes(query) || query.includes(t))) {
        matchedContentTypes.push(type);
      }
    }

    if (matchedContentTypes.length > 0) {
      // Combine: items matching content type OR fuzzy text match
      const typeMatches = new Set(
        result.filter(i => i.contentType && matchedContentTypes.includes(i.contentType)).map(i => i.id)
      );

      const fuse = new Fuse(result, FUSE_OPTIONS);
      const fuseResults = fuse.search(searchQuery);
      const fuseIds = new Set(fuseResults.map(r => r.item.id));

      result = result.filter(i => typeMatches.has(i.id) || fuseIds.has(i.id));
    } else {
      // Pure fuzzy search
      const fuse = new Fuse(result, FUSE_OPTIONS);
      const fuseResults = fuse.search(searchQuery);
      result = fuseResults.map(r => r.item);
    }
  }

  // Apply view-specific sorting
  if (filter.primaryView === 'library') {
    // Up Next items first (by bucket, priority, recency), then Queue items
    result = [...result].sort((a, b) => {
      // Up Next before Queue
      if (a.processingStatus !== b.processingStatus) {
        return a.processingStatus === 'up_next' ? -1 : 1;
      }

      // Within same status: priority then recency
      const priorityOrder: Record<string, number> = { high: 0, normal: 1, low: 2 };
      const aPri = priorityOrder[a.priority] ?? 1;
      const bPri = priorityOrder[b.priority] ?? 1;
      if (aPri !== bPri) return aPri - bPri;

      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    });
  } else if (filter.primaryView === 'signals') {
    // Recency
    result = [...result].sort((a, b) => {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    });
  } else if (filter.primaryView === 'read') {
    // By read_at descending
    result = [...result].sort((a, b) => {
      const aDate = a.readAt ? new Date(a.readAt).getTime() :
        (a.created_at ? new Date(a.created_at).getTime() : 0);
      const bDate = b.readAt ? new Date(b.readAt).getTime() :
        (b.created_at ? new Date(b.created_at).getTime() : 0);
      return bDate - aDate;
    });
  } else {
    // Default: recency
    result = [...result].sort((a, b) => {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    });
  }

  return result;
}

// Get suggested reading items (Up Next with today bucket first)
export function getSuggestedReading(items: ReadingItem[], limit: number = 4): ProposedReadingAction[] {
  const upNextToday = items.filter(i =>
    i.processingStatus === 'up_next' && i.readLaterBucket === 'today'
  );
  const upNextOther = items.filter(i =>
    i.processingStatus === 'up_next' && i.readLaterBucket !== 'today'
  );
  const queued = items.filter(i => i.processingStatus === 'queued');

  const candidates = [...upNextToday, ...upNextOther, ...queued];

  return candidates.slice(0, limit).map(item => ({
    item,
    reason: item.processingStatus === 'up_next'
      ? (item.readLaterBucket === 'today' ? 'Scheduled for today' : 'Marked as Up Next')
      : 'In your queue'
  }));
}

// Calculate estimated reading time
export function getEstimatedReadingTime(items: ReadingItem[]): string {
  const readableCount = items.filter(i =>
    i.processingStatus === 'up_next' || i.processingStatus === 'queued'
  ).length;
  const estimatedMinutes = readableCount * 5;

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
