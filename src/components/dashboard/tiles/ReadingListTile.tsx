import { BookOpen, ArrowRight, ExternalLink, Plus } from 'lucide-react';
import { useReadingItems } from '@/hooks/useReadingItems';
import { DashboardTile } from './DashboardTile';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface ReadingListTileProps {
  onAddClick: () => void;
}

export function ReadingListTile({ onAddClick }: ReadingListTileProps) {
  const { readingItems, loading } = useReadingItems();
  
  // Filter unread items and take first 3
  const unreadItems = readingItems.filter(item => !item.isRead).slice(0, 3);

  if (loading) {
    return (
      <DashboardTile title="Reading List" icon={BookOpen} colSpan={6}>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </DashboardTile>
    );
  }

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      <BookOpen className="w-8 h-8 mb-2" />
      <span className="text-sm font-medium mb-1">No reading items</span>
      <span className="text-xs mb-3">Save links to read later</span>
      <Button variant="outline" size="sm" onClick={onAddClick}>
        <Plus className="w-3 h-3 mr-1" /> Add Link
      </Button>
    </div>
  );

  return (
    <DashboardTile 
      title="Reading List" 
      icon={BookOpen} 
      colSpan={6}
      isEmpty={unreadItems.length === 0}
      emptyState={emptyState}
      action={
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddClick}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-xs h-7 gap-1">
            <Link to="/reading-list">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-2">
        {unreadItems.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-150 group"
          >
            {/* Favicon */}
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border flex items-center justify-center overflow-hidden flex-shrink-0">
              {item.favicon ? (
                <img src={item.favicon} alt="" className="w-5 h-5 object-contain" />
              ) : (
                <BookOpen className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {item.title}
                </h4>
                <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {item.hostname || new URL(item.url).hostname}
              </p>
            </div>
          </a>
        ))}
      </div>
    </DashboardTile>
  );
}
