
import { useState } from "react";
import { ReadingItem } from "@/types/readingItem";
import { fetchLinkMetadata } from "@/hooks/useReadingItems";
import { toast } from "sonner";

interface LinkMetadata {
  title: string;
  description?: string;
  image?: string;
  favicon?: string;
  hostname?: string;
  url: string;
}

export function useAddLinkForm() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);

  const resetForm = () => {
    setUrl("");
    setMetadata(null);
    setIsLoading(false);
    setFetchingMetadata(false);
    setProjectId(undefined);
  };

  const handleUrlChange = async (value: string) => {
    setUrl(value);
    setMetadata(null);

    if (value && (value.startsWith('http://') || value.startsWith('https://'))) {
      try {
        setFetchingMetadata(true);
        const fetchedMetadata = await fetchLinkMetadata(value);
        setMetadata(fetchedMetadata);
      } catch (error) {
        console.error("Error fetching metadata:", error);
      } finally {
        setFetchingMetadata(false);
      }
    }
  };

  const createLinkData = (url: string, metadata: LinkMetadata | null, selectedProjectId?: string): Omit<ReadingItem, 'id'> => {
    const baseData = {
      isRead: false,
      isFlagged: false,
      isArchived: false,
      project_id: selectedProjectId || projectId,
      processingStatus: 'unprocessed' as const,
      priority: 'normal' as const,
      topics: [] as string[],
      actionability: 'none' as const,
    };

    if (metadata) {
      return {
        ...baseData,
        url: metadata.url,
        title: metadata.title,
        description: metadata.description || undefined,
        favicon: metadata.favicon || undefined,
        image: metadata.image || undefined,
        hostname: metadata.hostname || undefined,
      };
    }

    try {
      const urlObj = new URL(url);
      return {
        ...baseData,
        url,
        title: urlObj.hostname,
        description: undefined,
        favicon: undefined,
        image: undefined,
        hostname: urlObj.hostname,
      };
    } catch {
      return {
        ...baseData,
        url,
        title: url,
        description: undefined,
        favicon: undefined,
        image: undefined,
        hostname: undefined,
      };
    }
  };

  const validateUrl = (url: string): boolean => {
    if (!url) return false;
    
    try {
      new URL(url);
      return true;
    } catch (e) {
      toast.error("Please enter a valid URL");
      return false;
    }
  };

  return {
    url,
    isLoading,
    metadata,
    fetchingMetadata,
    projectId,
    setProjectId,
    setIsLoading,
    resetForm,
    handleUrlChange,
    createLinkData,
    validateUrl
  };
}
