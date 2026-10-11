import { sendTelegramOrderNotification } from '../src/lib/notifications/telegram';
import type { Order } from '../src/lib/domain/types';

const testOrder: Order = {
  id: 'order_test_' + Date.now(),
  orderId: 'PMZ-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-TEST',
  status: 'confirmed',
  paymentStatus: 'paid_upi',
  orderType: 'delivery',
  customerName: 'Amaan (Test Order)',
  customerPhone: '9876543210',
  deliveryAddress: 'Flat 402, Royal Residency, Patna 800007',
  seatingNote: '',
  notes: 'Extra green chutney and fried onions please!',
  appliedCoupon: 'ZAIKA50',
  items: [
    {
      menuItemId: 'dish_biryani_royal',
      title: 'Royal Mutton Dum Biryani',
      pricePaise: 42000,
      qty: 2,
      lineTotalPaise: 84000,
    },
    {
      menuItemId: 'dish_butter_chicken',
      title: 'Zaika Special Butter Chicken',
      pricePaise: 38000,
      qty: 1,
      lineTotalPaise: 38000,
    },
    {
      menuItemId: 'dish_butter_naan',
      title: 'Garlic Butter Naan',
      pricePaise: 6000,
      qty: 4,
      lineTotalPaise: 24000,
    },
  ],
  totals: {
    itemsCount: 7,
    subtotalPaise: 146000,
    deliveryFeePaise: 4000,
    taxesPaise: 0,
    discountPaise: 5000,
    grandTotalPaise: 145000,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  trackingToken: 'test_token_' + Math.random().toString(36).slice(2, 12),
};

async function run() {
  console.log('Sending test order notification to Telegram...');
  const result = await sendTelegramOrderNotification(testOrder);
  console.log('Result:', JSON.stringify(result, null, 2));
}

run().catch(console.error);
