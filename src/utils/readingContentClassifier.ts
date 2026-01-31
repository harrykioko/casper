import type { ContentType, SavedFrom } from '@/types/readingItem';

const NEWSLETTER_HOSTS = [
  'substack.com', 'beehiiv.com', 'buttondown.email',
  'mailchi.mp', 'convertkit.com', 'revue.email',
  'ghost.io', 'paragraph.xyz',
];

const TOOL_PATH_INDICATORS = ['/pricing', '/docs', '/features', '/changelog', '/integrations'];
const BLOG_PATH_INDICATORS = ['/blog', '/posts/', '/articles/', '/writing/'];

export function classifyContentType(url: string, hostname: string | null): ContentType {
  const host = (hostname || '').toLowerCase();

  try {
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname.toLowerCase();

    // X/Twitter
    if (host.includes('x.com') || host.includes('twitter.com')) {
      return 'x_post';
    }

    // Newsletters
    if (NEWSLETTER_HOSTS.some(h => host.includes(h))) {
      return 'newsletter';
    }

    // Blog patterns
    if (BLOG_PATH_INDICATORS.some(p => path.includes(p)) || host.startsWith('blog.')) {
      return 'blog_post';
    }

    // Tool/product patterns
    if (TOOL_PATH_INDICATORS.some(p => path.includes(p))) {
      return 'tool';
    }
  } catch {
    // Invalid URL, fall through to default
  }

  return 'article';
}

export function inferSavedFrom(url: string, hostname: string | null): SavedFrom {
  const host = (hostname || '').toLowerCase();

  if (host.includes('x.com') || host.includes('twitter.com')) return 'x';
  if (host.includes('mail.google.com') || host.includes('outlook.')) return 'email';

  return 'web';
}
