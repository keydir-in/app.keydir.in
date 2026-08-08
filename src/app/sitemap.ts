import type { MetadataRoute } from 'next';
import { CATEGORY_SLUGS } from '@/lib/config/category-config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://app.keydir.in';

  // ponytail: static entries only — dynamic product URLs would need a DB query.
  // Adding product URLs requires fetching from DB and adding changeFrequency + priority.

  const catalog = CATEGORY_SLUGS.map((slug, i) => ({
    url: `${baseUrl}/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: i === 0 ? 0.9 : 0.8,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    ...catalog,
    { url: `${baseUrl}/compare/keyboards`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/compare/mouse`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
  ];
}
