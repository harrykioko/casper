import { motion } from "framer-motion";
import { Sun, Building2, FolderKanban, Mail, User } from "lucide-react";
import { format } from "date-fns";
import { LinkedEntity } from "@/hooks/useEnrichedTasks";
import { cn } from "@/lib/utils";

interface TodayRailProps {
  linkedEntity?: LinkedEntity;
}

export function TodayRail({ linkedEntity }: TodayRailProps) {
  const now = new Date();

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      {/* Today section */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-4">
          Today
        </h3>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {format(now, "EEEE")}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(now, "MMMM d, yyyy")}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">New York</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs text-muted-foreground">62°F · Clear</span>
          </div>
        </div>
      </div>

      {/* Context section — only if focus task has linked entity */}
      {linkedEntity && (
        <div>
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">
            Context
          </h3>
          <div className="space-y-2">
            <ContextRow entity={linkedEntity} />
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ContextRow({ entity }: { entity: LinkedEntity }) {
  const Icon =
    entity.type === "project"
      ? FolderKanban
      : entity.type === "email"
        ? Mail
        : entity.type === "portfolio" || entity.type === "pipeline"
          ? Building2
          : User;

  return (
    <div className="flex items-center gap-2.5 py-1.5">
      {entity.logo_url ? (
        <img
          src={entity.logo_url}
          alt=""
          className="h-5 w-5 rounded object-cover"
        />
      ) : (
        <div
          className={cn(
            "h-5 w-5 rounded flex items-center justify-center",
            "bg-muted"
          )}
          style={entity.color ? { backgroundColor: entity.color } : undefined}
        >
          <Icon className="h-3 w-3 text-muted-foreground" />
        </div>
      )}
      <span className="text-sm text-foreground truncate">{entity.name}</span>
    </div>
  );
}
