import { json, withErrorHandling } from '@/lib/http/api';
import { getSettings, storeAvailability } from '@/lib/settings/service';

export const runtime = 'nodejs';
export const revalidate = 120;

/**
 * Public storefront settings: pricing rules, opening hours, UPI details and the
 * announcement banner. Safe to expose – it contains no secrets.
 */
export const GET = withErrorHandling(async () => {
  const settings = await getSettings();
  const availability = storeAvailability(settings);

  return json(
    {
      ok: true,
      settings,
      availability,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
        'CDN-Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
      },
    }
  );
});