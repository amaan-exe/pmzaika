import { COLLECTIONS, getDb } from '@/lib/db';
import type { MenuItem } from '@/lib/domain/types';
import { buildSeedMenu } from '@/lib/menu/seed';
import { MENU_DATA } from '@/data/menuData';

export class MenuError extends Error {
  constructor(
    message: string,
    readonly status = 400
  ) {
    super(message);
    this.name = 'MenuError';
  }
}

const collection = async () => (await getDb()).collection<MenuItem>(COLLECTIONS.menu);

/**
 * Guarantees the menu exists before anything reads it.
 *
 * Checkout calls `resolveOrderLines` directly, which does not go through
 * `listMenu`, so seeding is centralised here and memoised per process.
 */
let seedPromise: Promise<MenuItem[]> | null = null;

export async function ensureMenuSeeded(): Promise<MenuItem[]> {
  seedPromise ??= (async () => {
    const menu = await collection();
    const existing = await menu.list({ limit: 1 });
    return existing.total === 0 ? seedMenu() : [];
  })().catch((error) => {
    // Allow a later request to retry rather than caching the failure.
    seedPromise = null;
    throw error;
  });

  return seedPromise;
}

interface MenuCache {
  items: MenuItem[];
  timestamp: number;
}

const MENU_CACHE_TTL_MS = 30_000;
let menuCache: MenuCache | null = null;
let inFlightFetch: Promise<MenuItem[]> | null = null;

export function invalidateMenuCache(): void {
  menuCache = null;
  seedPromise = null;
  inFlightFetch = null;
}

/** A deliberate admin re-seed must not be shadowed by the memoised check. */
export function invalidateMenuSeedCache(): void {
  invalidateMenuCache();
}

export interface ListMenuOptions {
  includeUnavailable?: boolean;
  category?: string;
}

async function syncMenuCatalog(items?: MenuItem[]): Promise<void> {
  try {
    const db = await getDb();
    let toSave = items;
    if (!toSave) {
      const menu = await collection();
      const { docs } = await menu.list({ orderBy: [{ field: 'sortOrder', direction: 'asc' }] });
      toSave = docs && docs.length > 0 ? docs : buildSeedMenu();
    }
    await db.collection(COLLECTIONS.settings).set('menu_catalog', {
      id: 'menu_catalog',
      items: toSave,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[menu.service] syncMenuCatalog error:', err);
  }
}

async function fetchAllRawMenu(): Promise<MenuItem[]> {
  if (menuCache && Date.now() - menuCache.timestamp < MENU_CACHE_TTL_MS) {
    return menuCache.items;
  }

  if (inFlightFetch) {
    return inFlightFetch;
  }

  inFlightFetch = (async () => {
    try {
      const fetchPromise = (async () => {
        const db = await getDb();

        // Spark Plan Optimization: Read 1 bundled snapshot document (1 read instead of 314 reads)
        try {
          const catalog = await db
            .collection<{ id: string; items: MenuItem[] }>(COLLECTIONS.settings)
            .get('menu_catalog');
          if (catalog && Array.isArray(catalog.items) && catalog.items.length > 0) {
            return catalog.items;
          }
        } catch (catalogErr) {
          console.warn('[menu.service] menu_catalog snapshot read failed:', catalogErr);
        }

        await ensureMenuSeeded();
        const menu = await collection();
        const { docs } = await menu.list({ orderBy: [{ field: 'sortOrder', direction: 'asc' }] });
        const items = docs && docs.length > 0 ? docs : buildSeedMenu();

        // Write bundled snapshot so all future fetches cost 1 read
        void syncMenuCatalog(items);
        return items;
      })();

      // Allow sufficient time for Firestore single-doc read (6000ms) instead of premature 450ms timeout
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000));
      const items = await Promise.race([fetchPromise, timeoutPromise]);

      if (items && items.length > 0) {
        menuCache = { items, timestamp: Date.now() };
        return items;
      }

      // Only if DB completely unreachable, transient fallback without caching for 15 minutes
      const fallback = buildSeedMenu();
      return fallback;
    } catch (err) {
      console.warn('[menu.service] Live menu fetch failed, falling back to seed menu:', err);
      return buildSeedMenu();
    } finally {
      inFlightFetch = null;
    }
  })();

  return inFlightFetch;
}

/**
 * Returns the live menu, using in-memory caching (5m TTL) and in-flight deduplication
 * so repeated requests cost 0 extra document reads.
 */
export async function listMenu(options: ListMenuOptions = {}): Promise<MenuItem[]> {
  const all = await fetchAllRawMenu();
  let items = [...all];

  if (!options.includeUnavailable) {
    items = items.filter((item) => item.isAvailable);
  }
  if (options.category && options.category !== 'all') {
    items = items.filter((item) => item.category === options.category);
  }

  return items;
}

/** Idempotent: only writes when the collection is empty. */
export async function seedMenu(): Promise<MenuItem[]> {
  invalidateMenuCache();
  const menu = await collection();
  const seeded = buildSeedMenu();

  await Promise.all(seeded.map((item) => menu.set(item.id, item)));
  menuCache = { items: seeded, timestamp: Date.now() };
  void syncMenuCatalog(seeded);
  return seeded;
}

export async function getMenuItem(id: string): Promise<MenuItem | null> {
  const all = await fetchAllRawMenu();
  const match = all.find((item) => item.id === id);
  if (match) return match;
  return (await collection()).get(id);
}

export interface CategorySummary {
  id: string;
  name: string;
  count: number;
  available: number;
}

export async function listCategories(): Promise<CategorySummary[]> {
  const items = await listMenu({ includeUnavailable: true });
  const map = new Map<string, CategorySummary>();

  for (const item of items) {
    const existing = map.get(item.category);
    if (existing) {
      existing.count += 1;
      if (item.isAvailable) existing.available += 1;
    } else {
      map.set(item.category, {
        id: item.category,
        name: item.categoryName,
        count: 1,
        available: item.isAvailable ? 1 : 0,
      });
    }
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export interface MenuItemInput {
  title: string;
  description?: string;
  pricePaise: number;
  category: string;
  categoryName?: string;
  image?: string;
  vegNonVeg?: 'veg' | 'non-veg';
  isAvailable?: boolean;
  isPopular?: boolean;
  badge?: string;
  sortOrder?: number;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function createMenuItem(input: MenuItemInput, actor: string): Promise<MenuItem> {
  const menu = await collection();
  const now = new Date().toISOString();

  const base = slugify(input.title) || `dish-${Date.now()}`;
  let id = base;
  let suffix = 2;
  while (await menu.get(id)) {
    id = `${base}-${suffix++}`;
  }

  const item: MenuItem = {
    id,
    title: input.title.trim(),
    description: input.description?.trim() ?? '',
    pricePaise: Math.max(0, Math.round(input.pricePaise)),
    category: input.category,
    categoryName: input.categoryName?.trim() || input.category,
    image: input.image?.trim() || '/assets/images/food_royal_biryani.jpg',
    vegNonVeg: input.vegNonVeg ?? 'non-veg',
    isAvailable: input.isAvailable ?? true,
    isPopular: input.isPopular ?? false,
    badge: input.badge?.trim() || undefined,
    sortOrder: input.sortOrder ?? Number.MAX_SAFE_INTEGER,
    createdAt: now,
    updatedAt: now,
  };

  await menu.set(id, item);
  if (menuCache) {
    const next = [...menuCache.items.filter((i) => i.id !== id), item].sort(
      (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
    );
    menuCache = { items: next, timestamp: Date.now() };
    void syncMenuCatalog(next);
  } else {
    invalidateMenuCache();
  }
  void actor;
  return item;
}

export async function updateMenuItem(
  id: string,
  patch: Partial<MenuItemInput>,
  actor: string
): Promise<MenuItem> {
  const menu = await collection();
  const updated = await menu.update(id, (current) => {
    const next: MenuItem = {
      ...current,
      ...patch,
      id: current.id,
      title: patch.title?.trim() ?? current.title,
      pricePaise:
        patch.pricePaise === undefined
          ? current.pricePaise
          : Math.max(0, Math.round(patch.pricePaise)),
      updatedAt: new Date().toISOString(),
    };
    return next;
  });

  if (!updated) throw new MenuError('Dish not found', 404);
  if (menuCache) {
    const next = menuCache.items.map((i) => (i.id === id ? updated : i));
    menuCache = { items: next, timestamp: Date.now() };
    void syncMenuCatalog(next);
  } else {
    invalidateMenuCache();
  }
  void actor;
  return updated;
}

/** Toggling availability is the most common kitchen action, so it gets its own path. */
export async function toggleAvailability(id: string): Promise<MenuItem> {
  const menu = await collection();
  const updated = await menu.update(id, (current) => ({
    ...current,
    isAvailable: !current.isAvailable,
    updatedAt: new Date().toISOString(),
  }));

  if (!updated) throw new MenuError('Dish not found', 404);
  if (menuCache) {
    const next = menuCache.items.map((i) => (i.id === id ? updated : i));
    menuCache = { items: next, timestamp: Date.now() };
    void syncMenuCatalog(next);
  } else {
    invalidateMenuCache();
  }
  return updated;
}

export async function deleteMenuItem(id: string): Promise<void> {
  const menu = await collection();
  const existing = await menu.get(id);
  if (!existing) throw new MenuError('Dish not found', 404);
  await menu.delete(id);
  if (menuCache) {
    const next = menuCache.items.filter((i) => i.id !== id);
    menuCache = { items: next, timestamp: Date.now() };
    void syncMenuCatalog(next);
  } else {
    invalidateMenuCache();
  }
}

export interface ResolvedLine {
  menuItemId: string;
  title: string;
  qty: number;
  pricePaise: number;
  lineTotalPaise: number;
  image: string;
  category: string;
  vegNonVeg: 'veg' | 'non-veg';
}

/**
 * Server-side price resolution for checkout.
 *
 * Prefers the live `menu` collection so admin edits take effect immediately, and
 * falls back to the static site menu when the collection has not been seeded.
 */
export async function resolveOrderLines(
  lines: Array<{ menuItemId: string; quantity: number }>
): Promise<{ items: ResolvedLine[]; unavailable: string[] }> {
  await ensureMenuSeeded();

  const allItems = await fetchAllRawMenu();
  const merged = new Map<string, ResolvedLine>();
  const unavailable: string[] = [];

  for (const line of lines) {
    const needle = line.menuItemId.trim().toLowerCase();
    const item =
      allItems.find((m) => m.id === line.menuItemId) ??
      allItems.find((m) => m.id.toLowerCase() === needle || m.title.toLowerCase() === needle) ??
      staticFallback(line.menuItemId);

    if (!item) {
      unavailable.push(line.menuItemId);
      continue;
    }

    if (!item.isAvailable) {
      unavailable.push(line.menuItemId);
      continue;
    }

    const existing = merged.get(item.id);
    const qty = existing ? existing.qty + line.quantity : line.quantity;

    merged.set(item.id, {
      menuItemId: item.id,
      title: item.title,
      qty,
      pricePaise: item.pricePaise,
      lineTotalPaise: item.pricePaise * qty,
      image: item.image,
      category: item.category,
      vegNonVeg: item.vegNonVeg,
    });
  }

  return { items: [...merged.values()], unavailable };
}

function staticFallback(id: string): MenuItem | null {
  const needle = id.trim().toLowerCase();
  const dish =
    MENU_DATA.find((entry) => entry.id === id) ??
    MENU_DATA.find((entry) => entry.id.toLowerCase() === needle || entry.name.toLowerCase() === needle);
  if (!dish) return null;

  return {
    id: dish.id,
    title: dish.name,
    description: dish.description,
    pricePaise: Math.round(dish.price * 100),
    category: dish.category,
    categoryName: dish.categoryName,
    image: dish.image,
    vegNonVeg: dish.isVeg ? 'veg' : 'non-veg',
    isAvailable: true,
    isPopular: Boolean(dish.badge),
    badge: dish.badge,
    sortOrder: 0,
    createdAt: '',
    updatedAt: '',
  };
}