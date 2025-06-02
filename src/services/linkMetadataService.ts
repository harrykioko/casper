
import { LinkMetadata } from '@/types/readingItem';

// Client-side metadata fetching using Microlink API directly
export const fetchLinkMetadata = async (url: string): Promise<LinkMetadata> => {
  const microlinkApi = `https://api.microlink.io/?url=${encodeURIComponent(url)}`;

  try {
    console.log('Fetching metadata for:', url);
    
    const res = await fetch(microlinkApi);

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(`Expected JSON but got ${contentType}`);
    }

    const data = await res.json();

    if (data.status !== 'success') {
      throw new Error(`Microlink API returned status: ${data.status}`);
    }

    const metadata = {
      title: data.data.title || new URL(url).hostname,
      description: data.data.description || null,
      image: data.data.image?.url || null,
      favicon: data.data.logo?.url || null,
      hostname: new URL(url).hostname,
      url: url
    };

    console.log('Metadata fetched successfully:', metadata);
    return metadata;
  } catch (err) {
    console.error(`[fetchLinkMetadata] Failed for ${url}:`, err.message);

    // Fallback if Microlink fails
    try {
      const urlObj = new URL(url);
      const fallback = {
        title: urlObj.hostname,
        description: null,
        image: null,
        favicon: null,
        hostname: urlObj.hostname,
        url: url
      };
      console.log('Using fallback metadata:', fallback);
      return fallback;
    } catch {
      throw new Error('Invalid URL');
    }
  }
};
