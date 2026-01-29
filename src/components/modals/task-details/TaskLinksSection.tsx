import { Mail, Building2 } from "lucide-react";
import { Task } from "@/hooks/useTasks";
import type { TaskCompanyLink } from "@/lib/taskCompanyLink";

interface TaskLinksSectionProps {
  task: Task;
  companyLink?: TaskCompanyLink | null;
}

export function TaskLinksSection({ task, companyLink }: TaskLinksSectionProps) {
  const hasSourceEmail = !!task.source_inbox_item_id;
  const hasCompany = !!companyLink;

  if (!hasSourceEmail && !hasCompany) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        Links
      </h4>
      <div className="space-y-1.5">
        {hasSourceEmail && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Created from email</span>
          </div>
        )}
        {hasCompany && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{companyLink.name || "Linked company"}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {companyLink.type}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
