import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/auth/', '/api/', '/settings/'],
      },
    ],
    sitemap: 'https://app.keydir.in/sitemap.xml',
  };
}
