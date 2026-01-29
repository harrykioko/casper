import { cn } from "@/lib/utils";
import { Link2, FileText, Activity, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EntityLink, ItemExtract } from "@/hooks/useWorkItemDetail";
import type { WorkQueueItem } from "@/hooks/useWorkQueue";

interface WorkItemContextRailProps {
  workItem: WorkQueueItem | null;
  entityLinks: EntityLink[];
  extracts: ItemExtract[];
  relatedItems: WorkQueueItem[];
  isLoading: boolean;
}

export function WorkItemContextRail({
  workItem,
  entityLinks,
  extracts,
  relatedItems,
  isLoading,
}: WorkItemContextRailProps) {
  if (!workItem) {
    return (
      <div className="sticky top-24 self-start text-sm text-muted-foreground text-center py-12">
        Select an item to see context
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="sticky top-24 self-start flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const aiLinks = entityLinks.filter(l => l.link_reason === 'ai_match');
  const confirmedLinks = entityLinks.filter(l => l.link_reason !== 'ai_match');
  const entitiesExtract = extracts.find(e => e.extract_type === 'key_entities');
  const entities = (entitiesExtract?.content as any)?.items || [];

  return (
    <div className="sticky top-24 self-start space-y-5">
      {/* Suggested Links */}
      {aiLinks.length > 0 && (
        <ContextSection title="Suggested Links" icon={Link2}>
          {aiLinks.map(link => (
            <div
              key={link.id}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="capitalize">{link.target_type}</span>
              {link.confidence && (
                <span className="text-xs text-muted-foreground/60">
                  {Math.round(link.confidence * 100)}%
                </span>
              )}
            </div>
          ))}
        </ContextSection>
      )}

      {/* Confirmed Links */}
      {confirmedLinks.length > 0 && (
        <ContextSection title="Linked Entities" icon={Link2}>
          {confirmedLinks.map(link => (
            <div key={link.id} className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                {link.target_type}
              </Badge>
              <span className="text-xs text-muted-foreground">{link.link_reason}</span>
            </div>
          ))}
        </ContextSection>
      )}

      {/* Key Entities */}
      {entities.length > 0 && (
        <ContextSection title="Key Entities" icon={FileText}>
          {entities.map((entity: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="text-foreground">{entity.name}</span>
              <Badge variant="outline" className="text-[10px]">{entity.type}</Badge>
            </div>
          ))}
        </ContextSection>
      )}

      {/* Related Items */}
      {relatedItems.length > 0 && (
        <ContextSection title="Related Items" icon={Activity}>
          {relatedItems.slice(0, 5).map(item => (
            <div key={item.id} className="text-sm text-muted-foreground">
              <span className="capitalize text-[10px] text-muted-foreground/60 mr-1">
                {item.source_type.replace('_', ' ')}
              </span>
              <span className="text-foreground/80">{item.source_title || 'Untitled'}</span>
            </div>
          ))}
        </ContextSection>
      )}

      {/* Empty state */}
      {aiLinks.length === 0 && confirmedLinks.length === 0 && entities.length === 0 && relatedItems.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No context available yet
        </div>
      )}
    </div>
  );
}

function ContextSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Link2;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h4>
      </div>
      <div className="space-y-1.5 pl-5">{children}</div>
    </div>
  );
}
