import {
  ADMIN_EMAILS,
  isFirebaseConfigured,
  persistenceMode,
  RESTAURANT,
} from '@/lib/env';
import { json, withErrorHandling } from '@/lib/http/api';
import { getSettings } from '@/lib/settings/service';
import { SEED_MENU_SIZE } from '@/lib/menu/seed';
import { isWebPushConfigured } from '@/lib/notifications/webpush';

export const runtime = 'nodejs';

/** Cheap readiness probe – also surfaces the active configuration for debugging. */
export const GET = withErrorHandling(async () => {
  const settings = await getSettings();

  return json({
    ok: true,
    service: 'pm-zaika-backend',
    persistence: persistenceMode(),
    firebaseConfigured: isFirebaseConfigured(),
    adminConfigured: ADMIN_EMAILS.length > 0,
    telegramConfigured: Boolean(
      process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID
    ),
    webPushConfigured: isWebPushConfigured(),
    webhookConfigured: Boolean(process.env.ORDER_WEBHOOK_URL),
    menu: { sourceItems: SEED_MENU_SIZE },
    restaurant: {
      name: settings.restaurantName,
      isStoreOpen: settings.isStoreOpen,
      upi: settings.storeUpiId,
    },
    pricing: {
      deliveryChargePaise: settings.deliveryChargePaise,
      freeDeliveryAbovePaise: settings.freeDeliveryAbovePaise,
      minimumOrderPaise: settings.minimumOrderPaise,
      gstPercentage: settings.gstPercentage,
    },
    restaurantWhatsapp: RESTAURANT.whatsapp,
    time: new Date().toISOString(),
  });
});