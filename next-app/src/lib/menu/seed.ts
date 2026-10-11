import { SOURCE_MENU, type SourceMenuItem } from '@/data/menuItemsSource';
import { DISH_PHOTOS } from '@/data/dishPhotos';
import { MENU_DATA } from '@/data/menuData';
import type { MenuItem } from '@/lib/domain/types';

/**
 * Best-effort image resolution for seeded dishes.
 *
 * Preference order:
 *   1. a real photograph captured by the restaurant (auto-matched by name)
 *   2. an existing dish image already used elsewhere on the site
 *   3. a sensible per-category fallback, so nothing ever renders broken
 */
const EXISTING_BY_NAME = new Map<string, string>(
  MENU_DATA.map((item) => [normalise(item.name), item.image])
);

/**
 * Last-resort artwork, chosen to at least resemble the category so the menu
 * never shows a biryani next to a soup. Keys cover every category id produced
 * by `menuItemsSource.ts`.
 */
const CATEGORY_FALLBACK: Record<string, string> = {
  biryani: '/assets/images/food_royal_biryani.webp',
  rice: '/assets/images/food_royal_biryani.webp',
  thali: '/assets/images/food_royal_thali.webp',
  buffet: '/assets/images/food_royal_thali.webp',

  'veg-curry': '/assets/images/food_butter_curry.webp',
  'non-veg-curry': '/assets/images/food_butter_curry.webp',
  dal: '/assets/images/food_butter_curry.webp',

  tandoori: '/assets/images/food_tandoori_kebab.webp',
  'tandoori-veg': '/assets/images/food_tandoori_kebab.webp',
  kebab: '/assets/images/food_tandoori_kebab.webp',
  kawab: '/assets/images/food_tandoori_kebab.webp',
  'starters-non-veg': '/assets/images/food_tandoori_kebab.webp',

  momos: '/assets/images/food_momos_noodles.webp',
  noodles: '/assets/images/food_momos_noodles.webp',
  'chinese-veg': '/assets/images/food_momos_noodles.webp',
  'chinese-non-veg': '/assets/images/food_momos_noodles.webp',

  // Bread sits best on a full thali shot.
  naan: '/assets/images/food_royal_thali.webp',
  kulcha: '/assets/images/food_royal_thali.webp',
  roti: '/assets/images/food_royal_thali.webp',

  starters: '/assets/images/image2.webp',
  soup: '/assets/images/image2.webp',
  rolls: '/assets/images/image2.webp',
  accompaniment: '/assets/images/image2.webp',

  desserts: '/assets/images/IMAGE23.webp',
  'tea-coffee': '/assets/images/IMAGE23.webp',
  beverage: '/assets/images/IMAGE23.webp',
};

const GENERIC_FALLBACK = '/assets/images/food_royal_biryani.webp';

export function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function resolveImage(item: SourceMenuItem): string {
  // 1. A real photograph of this exact dish.
  const photographed = DISH_PHOTOS[item.id];
  if (photographed) return photographed;

  // 2. The same dish already illustrated elsewhere on the site.
  const exact = EXISTING_BY_NAME.get(normalise(item.name));
  if (exact) return exact;

  // Try dropping size/portion suffixes, e.g. "Chicken kawab (2 pc)".
  const simplified = normalise(item.name.replace(/\([^)]*\)|\b(full|half|regular)\b/g, ''));
  const near = EXISTING_BY_NAME.get(simplified);
  if (near) return near;

  // 3. Category fallback.
  return CATEGORY_FALLBACK[item.category] ?? GENERIC_FALLBACK;
}

/** Converts the extracted PM Zaika menu into seeded `menu` documents. */
export function buildSeedMenu(): MenuItem[] {
  const now = new Date().toISOString();
  const perCategoryCounter = new Map<string, number>();

  return SOURCE_MENU.map((item) => {
    const position = (perCategoryCounter.get(item.category) ?? 0) + 1;
    perCategoryCounter.set(item.category, position);

    return {
      id: item.id,
      title: item.name,
      description: item.description,
      pricePaise: Math.round(item.price * 100),
      category: item.category,
      categoryName: item.categoryName,
      image: resolveImage(item),
      vegNonVeg: item.isVeg ? 'veg' : 'non-veg',
      isAvailable: true,
      isPopular: item.tags.includes('bestseller'),
      badge: item.tags.length > 0 ? item.tags[0] : undefined,
      sortOrder: position,
      createdAt: now,
      updatedAt: now,
    } satisfies MenuItem;
  });
}

export const SEED_MENU_SIZE = SOURCE_MENU.length;