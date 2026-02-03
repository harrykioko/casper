import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useReadingEnrichment() {
  const queryClient = useQueryClient();

  const enrichItem = async (readingItemId: string) => {
    // Fetch the item to check if enrichment is needed
    const { data: item } = await supabase
      .from("reading_items")
      .select("id, url, title, description, hostname, content_type, one_liner, topics")
      .eq("id", readingItemId)
      .single();

    if (!item) return;

    // Skip if already enriched
    if (item.one_liner && item.topics && item.topics.length > 0) return;

    try {
      const { data, error } = await supabase.functions.invoke("reading-enrich", {
        body: {
          reading_item_id: item.id,
          url: item.url,
          title: item.title,
          description: item.description,
          hostname: item.hostname,
          content_type: item.content_type,
        },
      });

      if (error) {
        console.error("Reading enrichment failed:", error);
        return;
      }

      // Invalidate queries so UI picks up the new data
      queryClient.invalidateQueries({ queryKey: ["reading_items"] });
      queryClient.invalidateQueries({ queryKey: ["focus_queue"] });

      return data;
    } catch (err) {
      console.error("Reading enrichment error:", err);
    }
  };

  return { enrichItem };
}
