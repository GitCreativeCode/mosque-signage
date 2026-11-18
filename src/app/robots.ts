import type { MetadataRoute } from 'next';

/**
 * Search Engine Robot Suppression
 * MosqueSignage Kiosk Display Appliance
 *
 * Explicitly instructs compliant web crawlers not to index any routes.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: '/',
      },
    ],
  };
}

