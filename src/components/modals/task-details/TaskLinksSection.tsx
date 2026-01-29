import { useState, useEffect } from "react";
import { Mail, Building2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Task } from "@/hooks/useTasks";
import { supabase } from "@/integrations/supabase/client";
import { fetchInboxItemById } from "@/lib/inbox/fetchInboxItemById";
import { useGlobalInboxDrawer } from "@/contexts/GlobalInboxDrawerContext";
import type { TaskCompanyLink } from "@/lib/taskCompanyLink";
import type { InboxItem } from "@/types/inbox";

interface TaskLinksSectionProps {
  task: Task;
  companyLink?: TaskCompanyLink | null;
}

interface CompanyInfo {
  name: string;
  logo_url: string | null;
  type: "portfolio" | "pipeline";
  id: string;
}

export function TaskLinksSection({ task, companyLink }: TaskLinksSectionProps) {
  const navigate = useNavigate();
  const { openDrawer } = useGlobalInboxDrawer();
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [emailSubject, setEmailSubject] = useState<string | null>(null);
  const [emailItem, setEmailItem] = useState<InboxItem | null>(null);

  const hasSourceEmail = !!task.source_inbox_item_id;
  const hasCompany = !!companyLink;

  // Fetch company info (logo + name)
  useEffect(() => {
    if (!companyLink) {
      setCompanyInfo(null);
      return;
    }

    const fetchCompany = async () => {
      if (companyLink.type === "portfolio") {
        const { data } = await supabase
          .from("companies")
          .select("id, name, logo_url")
          .eq("id", companyLink.id)
          .single();
        if (data) {
          setCompanyInfo({
            name: data.name,
            logo_url: data.logo_url,
            type: "portfolio",
            id: data.id,
          });
        }
      } else {
        const { data } = await supabase
          .from("pipeline_companies")
          .select("id, company_name, logo_url")
          .eq("id", companyLink.id)
          .single();
        if (data) {
          setCompanyInfo({
            name: data.company_name,
            logo_url: data.logo_url,
            type: "pipeline",
            id: data.id,
          });
        }
      }
    };

    fetchCompany();
  }, [companyLink?.id, companyLink?.type]);

  // Fetch email subject
  useEffect(() => {
    if (!task.source_inbox_item_id) {
      setEmailSubject(null);
      setEmailItem(null);
      return;
    }

    const fetchEmail = async () => {
      const item = await fetchInboxItemById(task.source_inbox_item_id!);
      if (item) {
        setEmailSubject(item.subject);
        setEmailItem(item);
      }
    };

    fetchEmail();
  }, [task.source_inbox_item_id]);

  const handleCompanyClick = () => {
    if (!companyInfo) return;
    const route =
      companyInfo.type === "portfolio"
        ? `/portfolio/${companyInfo.id}`
        : `/pipeline/${companyInfo.id}`;
    navigate(route);
  };

  const handleEmailClick = () => {
    if (!emailItem) return;
    openDrawer(emailItem, {
      onCreateTask: () => {},
      onMarkComplete: () => {},
      onArchive: () => {},
    });
  };

  if (!hasSourceEmail && !hasCompany) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        Links
      </h4>
      <div className="space-y-2">
        {/* Company link */}
        {companyInfo && (
          <button
            onClick={handleCompanyClick}
            className="flex items-center gap-3 w-full p-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-left group"
          >
            <div className="w-8 h-8 rounded-md bg-white dark:bg-zinc-800 border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
              {companyInfo.logo_url ? (
                <img
                  src={companyInfo.logo_url}
                  alt={companyInfo.name}
                  className="max-w-full max-h-full object-contain p-0.5"
                />
              ) : (
                <span className="text-sm font-semibold text-muted-foreground">
                  {companyInfo.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {companyInfo.name}
              </p>
              <p className="text-[11px] text-muted-foreground capitalize">
                {companyInfo.type}
              </p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </button>
        )}

        {/* Email link */}
        {hasSourceEmail && (
          <button
            onClick={handleEmailClick}
            disabled={!emailItem}
            className="flex items-center gap-3 w-full p-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors text-left group disabled:opacity-50 disabled:cursor-default"
          >
            <div className="w-8 h-8 rounded-md bg-sky-50 dark:bg-sky-900/30 border border-border flex items-center justify-center flex-shrink-0">
              <Mail className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {emailSubject || "Loading..."}
              </p>
              <p className="text-[11px] text-muted-foreground">Source email</p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
}
