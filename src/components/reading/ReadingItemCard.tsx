import { Star, Folder, Trash, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ReadingItem, ContentType } from "@/types/readingItem";

const CONTENT_TYPE_STYLES: Record<string, { label: string; color: string }> = {
  article: { label: "Article", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  x_post: { label: "X Post", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  blog_post: { label: "Blog", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  newsletter: { label: "Newsletter", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  tool: { label: "Tool", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
};

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-500",
  low: "bg-slate-400",
};

interface ReadingItemCardProps {
  item: ReadingItem;
  projects: Array<{ id: string; name: string; color?: string | null }>;
  variant?: "default" | "spotlight";
  onFavorite: (id: string) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateProject: (id: string, projectId: string | null) => void;
}

export function ReadingItemCard({
  item,
  projects,
  variant = "default",
  onFavorite,
  onMarkRead,
  onDelete,
  onUpdateProject,
}: ReadingItemCardProps) {
  const contentStyle = item.contentType ? CONTENT_TYPE_STYLES[item.contentType] : null;
  const priorityDot = PRIORITY_DOT[item.priority];
  const isSpotlight = variant === "spotlight";

  return (
    <motion.div
      className={cn(
        "group relative rounded-xl backdrop-blur-sm transition-all duration-200 cursor-pointer",
        "shadow-sm hover:shadow-lg hover:scale-[1.02]",
        isSpotlight
          ? "bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 ring-1 ring-primary/10"
          : "bg-white/60 dark:bg-zinc-900/40 border border-white/20 dark:border-white/10",
        item.isRead && "opacity-60"
      )}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
    >
      <div className="p-4">
        {/* Image */}
        {item.image && (
          <div className="mb-3">
            <img
              src={item.image}
              alt=""
              className={cn(
                "w-full rounded-lg object-cover",
                isSpotlight ? "h-36" : "h-32"
              )}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}

        {/* Header with favicon, content type chip, and actions */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {item.favicon && (
              <img
                src={item.favicon}
                alt=""
                className="w-4 h-4 rounded flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {item.hostname || new URL(item.url).hostname}
            </p>
            {priorityDot && (
              <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", priorityDot)} />
            )}
            {contentStyle && (
              <Badge
                variant="outline"
                className={cn("text-[9px] px-1 py-0 h-4 flex-shrink-0", contentStyle.color)}
              >
                {contentStyle.label}
              </Badge>
            )}
            {item.isFlagged && (
              <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
            )}
            {/* Project badge */}
            {item.project_id &&
              (() => {
                const project = projects.find((p) => p.id === item.project_id);
                return project ? (
                  <span
                    className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 bg-muted/80 text-muted-foreground border border-border/50"
                    style={
                      project.color
                        ? {
                            backgroundColor: `${project.color}15`,
                            borderColor: `${project.color}30`,
                            color: project.color,
                          }
                        : undefined
                    }
                  >
                    <Folder className="w-2.5 h-2.5" />
                    <span className="max-w-[60px] truncate">{project.name}</span>
                  </span>
                ) : null;
              })()}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-6 w-6 rounded-full",
                    item.project_id
                      ? "text-primary"
                      : "text-zinc-500 hover:text-primary"
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Folder className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-popover border border-border z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuItem
                  onClick={() => onUpdateProject(item.id, null)}
                  className={cn(!item.project_id && "bg-accent")}
                >
                  No project
                </DropdownMenuItem>
                {projects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    onClick={() => onUpdateProject(item.id, project.id)}
                    className={cn(item.project_id === project.id && "bg-accent")}
                  >
                    <div className="flex items-center gap-2">
                      {project.color && (
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: project.color }}
                        />
                      )}
                      <span>{project.name}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "h-6 w-6 rounded-full",
                item.isFlagged
                  ? "text-amber-500"
                  : "text-zinc-500 hover:text-amber-500"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onFavorite(item.id);
              }}
            >
              <Star className={cn("h-3 w-3", item.isFlagged && "fill-current")} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className={`h-6 w-6 rounded-full ${
                item.isRead
                  ? "text-green-500"
                  : "text-zinc-500 hover:text-green-500"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(item.id);
              }}
            >
              <Check className="h-3 w-3" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 rounded-full text-zinc-500 hover:text-rose-500"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
            >
              <Trash className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Bucket badge for Up Next items */}
        {item.readLaterBucket && item.processingStatus === "up_next" && (
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 mb-1.5 bg-amber-500/10 text-amber-400 border-amber-500/20"
          >
            {item.readLaterBucket === "today" ? "Today" : "This Week"}
          </Badge>
        )}

        {/* Title */}
        <h3
          className={cn(
            "font-medium text-sm line-clamp-2 text-zinc-800 dark:text-white/90 mb-1",
            item.isRead && "line-through"
          )}
        >
          {item.title}
        </h3>

        {/* One-liner or description */}
        {item.oneLiner ? (
          <p className="text-xs text-zinc-600 dark:text-white/60 line-clamp-2 mb-1.5">
            {item.oneLiner}
          </p>
        ) : item.description ? (
          <p className="text-xs text-zinc-600 dark:text-white/60 line-clamp-3">
            {item.description}
          </p>
        ) : null}

        {/* Topics */}
        {item.topics && item.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.topics.slice(0, 3).map((topic) => (
              <span
                key={topic}
                className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground"
              >
                {topic}
              </span>
            ))}
            {item.topics.length > 3 && (
              <span className="text-[9px] px-1 text-muted-foreground">
                +{item.topics.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
