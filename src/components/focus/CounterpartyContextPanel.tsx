/**
 * CounterpartyContextPanel - Shows person/company context for a commitment
 */

import { useEffect, useState } from "react";
import { User, Building2, Star, Handshake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";

interface CounterpartyContextPanelProps {
  personId?: string;
  personName?: string;
  companyId?: string;
  companyName?: string;
  companyType?: "portfolio" | "pipeline";
}

interface PersonDetails {
  id: string;
  name: string;
  email?: string;
  isVip: boolean;
}

interface RecentCommitment {
  id: string;
  title?: string;
  content: string;
  status: string;
  direction?: string;
  dueAt?: string;
  createdAt: string;
}

export function CounterpartyContextPanel({
  personId,
  personName,
  companyId,
  companyName,
  companyType,
}: CounterpartyContextPanelProps) {
  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [recentCommitments, setRecentCommitments] = useState<RecentCommitment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!personId && !companyId) return;
    setLoading(true);

    const fetchData = async () => {
      // Fetch person details
      if (personId) {
        const { data } = await supabase
          .from("people")
          .select("id, name, email, is_vip")
          .eq("id", personId)
          .maybeSingle();

        if (data) {
          setPerson({
            id: data.id,
            name: data.name,
            email: data.email || undefined,
            isVip: data.is_vip || false,
          });
        }
      }

      // Fetch recent commitments with this person/company
      let query = supabase
        .from("commitments")
        .select("id, title, content, status, direction, due_at, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (personId) {
        query = query.eq("person_id", personId);
      } else if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { data: commitments } = await query;

      setRecentCommitments(
        (commitments || []).map((c) => ({
          id: c.id,
          title: c.title,
          content: c.content,
          status: c.status,
          direction: c.direction,
          dueAt: c.due_at,
          createdAt: c.created_at,
        }))
      );

      setLoading(false);
    };

    fetchData();
  }, [personId, companyId]);

  if (!personId && !companyId) return null;
  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-muted/20">
        <div className="h-4 w-32 bg-muted/40 animate-pulse rounded" />
      </div>
    );
  }

  const displayName = person?.name || personName || companyName || "Unknown";

  return (
    <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
      <div className="flex items-center gap-2">
        {personId ? (
          <User className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Building2 className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-sm font-medium">{displayName}</span>
        {person?.isVip && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            <Star className="h-2.5 w-2.5 mr-0.5 text-yellow-400" />
            VIP
          </Badge>
        )}
        {companyType && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {companyType}
          </Badge>
        )}
      </div>

      {person?.email && (
        <p className="text-xs text-muted-foreground">{person.email}</p>
      )}

      {companyName && personId && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="h-3 w-3" />
          {companyName}
        </div>
      )}

      {recentCommitments.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-border">
          <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Handshake className="h-3 w-3" />
            Recent obligations ({recentCommitments.length})
          </h4>
          {recentCommitments.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2 text-xs py-1"
            >
              <Badge
                variant="outline"
                className={`text-[9px] px-1 py-0 ${
                  c.status === "completed"
                    ? "text-emerald-400 border-emerald-400/30"
                    : c.status === "broken"
                    ? "text-red-400 border-red-400/30"
                    : "text-amber-400 border-amber-400/30"
                }`}
              >
                {c.status}
              </Badge>
              <span className="truncate flex-1 text-muted-foreground">
                {c.title || c.content}
              </span>
              {c.dueAt && (
                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                  {format(parseISO(c.dueAt), "MMM d")}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
