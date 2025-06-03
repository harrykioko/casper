
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

  const resetForm = () => {
    setUrl("");
    setMetadata(null);
    setIsLoading(false);
    setFetchingMetadata(false);
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

  const createLinkData = (url: string, metadata: LinkMetadata | null): Omit<ReadingItem, 'id'> => {
    if (metadata) {
      return {
        url: metadata.url,
        title: metadata.title,
        description: metadata.description || null,
        favicon: metadata.favicon || null,
        image: metadata.image || null,
        hostname: metadata.hostname || null,
        isRead: false
      };
    }

    try {
      const urlObj = new URL(url);
      return {
        url,
        title: urlObj.hostname,
        description: null,
        favicon: null,
        image: null,
        hostname: urlObj.hostname,
        isRead: false
      };
    } catch {
      return {
        url,
        title: url,
        description: null,
        favicon: null,
        image: null,
        hostname: null,
        isRead: false
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
    setIsLoading,
    resetForm,
    handleUrlChange,
    createLinkData,
    validateUrl
  };
}
