import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { WorkQueueItem, WorkItemSourceType } from "./useWorkQueue";

export interface EntityLink {
  id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  link_reason: string | null;
  confidence: number | null;
  created_at: string;
}

export interface ItemExtract {
  id: string;
  source_type: string;
  source_id: string;
  extract_type: string;
  content: any;
  created_at: string;
}

export interface WorkItemDetail {
  workItem: WorkQueueItem;
  sourceRecord: any;
  entityLinks: EntityLink[];
  extracts: ItemExtract[];
}

export function useWorkItemDetail(workItem: WorkQueueItem | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["work_item_detail", workItem?.id],
    queryFn: async (): Promise<WorkItemDetail | null> => {
      if (!workItem || !user?.id) return null;

      // Fetch all in parallel
      const [sourceResult, linksResult, extractsResult] = await Promise.all([
        fetchSourceRecord(workItem.source_type, workItem.source_id),
        supabase
          .from("entity_links")
          .select("*")
          .eq("created_by", user.id)
          .eq("source_type", workItem.source_type)
          .eq("source_id", workItem.source_id),
        supabase
          .from("item_extracts")
          .select("*")
          .eq("created_by", user.id)
          .eq("source_type", workItem.source_type)
          .eq("source_id", workItem.source_id),
      ]);

      return {
        workItem,
        sourceRecord: sourceResult,
        entityLinks: (linksResult.data || []) as EntityLink[],
        extracts: (extractsResult.data || []) as ItemExtract[],
      };
    },
    enabled: !!workItem && !!user?.id,
  });
}

async function fetchSourceRecord(sourceType: WorkItemSourceType, sourceId: string) {
  switch (sourceType) {
    case 'email': {
      const { data } = await supabase
        .from("inbox_items")
        .select("*")
        .eq("id", sourceId)
        .single();
      return data;
    }
    case 'calendar_event': {
      const { data } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("id", sourceId)
        .single();
      return data;
    }
    case 'task': {
      const { data } = await supabase
        .from("tasks")
        .select("*, project:projects(id, name, color)")
        .eq("id", sourceId)
        .single();
      return data;
    }
    case 'note': {
      const { data } = await supabase
        .from("project_notes")
        .select("*, note_links(*)")
        .eq("id", sourceId)
        .single();
      return data;
    }
    case 'reading': {
      const { data } = await supabase
        .from("reading_items")
        .select("*")
        .eq("id", sourceId)
        .single();
      return data;
    }
    default:
      return null;
  }
}
