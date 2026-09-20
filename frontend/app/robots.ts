import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/customers/', '/segments/', '/campaigns/', '/analytics/', '/ai-studio/', '/super-admin/', '/settings/'],
    },
    sitemap: 'https://catalystcrm.ai/sitemap.xml',
  }
}
