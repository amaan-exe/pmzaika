import { json, withErrorHandling } from '@/lib/http/api';
import { getSettings, storeAvailability } from '@/lib/settings/service';

export const runtime = 'nodejs';

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
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    }
  );
});