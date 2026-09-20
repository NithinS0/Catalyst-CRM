import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/about',
    '/blog',
    '/careers',
    '/contact',
    '/gdpr',
    '/privacy',
    '/security',
    '/soc2',
    '/terms',
    '/press',
  ];
  return routes.map((route) => ({
    url: `https://catalystcrm.ai${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: route === '' ? 1.0 : 0.8,
  }))
}
