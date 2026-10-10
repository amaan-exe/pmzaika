import { COLLECTIONS, getDb } from '@/lib/db';
import type { SavedAddress, UserProfile } from '@/lib/domain/types';
import type { Order } from '@/lib/domain/types';

export class ProfileError extends Error {
  constructor(
    message: string,
    readonly status = 400
  ) {
    super(message);
    this.name = 'ProfileError';
  }
}

const users = async () => (await getDb()).collection<UserProfile>(COLLECTIONS.users);

function emptyProfile(uid: string, email: string): UserProfile {
  const now = new Date().toISOString();
  return {
    id: uid,
    email,
    displayName: '',
    phone: '',
    photoURL: '',
    addresses: [],
    createdAt: now,
    updatedAt: now,
  };
}

export async function getProfile(uid: string, email = ''): Promise<UserProfile> {
  const collection = await users();
  const existing = await collection.get(uid);
  if (existing) return existing;

  return emptyProfile(uid, email);
}

export interface ProfileAddressInput {
  id?: string;
  label?: string;
  fullAddress?: string;
  landmark?: string;
  phone?: string;
  isDefault?: boolean;
}

export interface ProfilePatch {
  displayName?: string;
  phone?: string;
  photoURL?: string;
  addresses?: ProfileAddressInput[];
}

export async function updateProfile(
  uid: string,
  email: string,
  patch: ProfilePatch
): Promise<UserProfile> {
  const collection = await users();
  const current = (await collection.get(uid)) ?? emptyProfile(uid, email);

  const addresses: SavedAddress[] = (patch.addresses ?? []).map((address, index) => ({
    id: address.id ?? `addr-${Date.now().toString(36)}-${index}`,
    label: address.label ?? 'Home',
    fullAddress: address.fullAddress ?? '',
    landmark: address.landmark ?? '',
    phone: address.phone ?? '',
    isDefault: address.isDefault ?? false,
  }));

  // Exactly one address may be the default.
  const defaultIndex = addresses.findIndex((address) => address.isDefault);
  addresses.forEach((address, index) => {
    address.isDefault = index === (defaultIndex === -1 ? 0 : defaultIndex);
  });

  const next: UserProfile = {
    ...current,
    email: email || current.email,
    displayName: patch.displayName?.trim() ?? current.displayName,
    phone: patch.phone?.trim() ?? current.phone,
    photoURL: patch.photoURL?.trim() ?? current.photoURL,
    addresses,
    updatedAt: new Date().toISOString(),
  };

  await collection.set(uid, next);
  return next;
}

/** Creates the customer record on the first successful order without
 * overwriting saved addresses or profile preferences. */
export async function ensureProfileFromOrder(
  uid: string,
  email: string,
  displayName: string,
  phone: string
): Promise<UserProfile> {
  const collection = await users();
  const current = (await collection.get(uid)) ?? emptyProfile(uid, email);

  const next: UserProfile = {
    ...current,
    email: email || current.email,
    displayName: current.displayName || displayName.trim(),
    phone: current.phone || phone.trim(),
    updatedAt: new Date().toISOString(),
  };

  await collection.set(uid, next);
  return next;
}

/** Full order history for a signed-in customer, newest first. */
export async function listUserOrders(uid: string, limit = 50): Promise<Order[]> {
  const db = await getDb();

  const collected: Order[] = [];
  for (const name of [COLLECTIONS.orders, COLLECTIONS.orderArchive]) {
    const { docs } = await db
      .collection<Order>(name)
      .list({ filters: [{ field: 'userId', op: '==', value: uid }] });
    collected.push(...docs);
  }

  return collected
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export interface AdminUserSummary {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  orderCount: number;
  spentPaise: number;
  lastOrderAt: string | null;
}

/** Customer directory for the admin desk. */
export async function listUsers(limit = 100): Promise<AdminUserSummary[]> {
  const db = await getDb();
  const [{ docs: profiles }, { docs: activeOrders }, { docs: archivedOrders }] =
    await Promise.all([
      db.collection<UserProfile>(COLLECTIONS.users).list({ limit }),
      db.collection<Order>(COLLECTIONS.orders).list({ limit: 500 }),
      db.collection<Order>(COLLECTIONS.orderArchive).list({ limit: 500 }).catch(() => ({ docs: [] })),
    ]);

  const allOrders = [...activeOrders, ...archivedOrders];
  const byUser = new Map<string, { count: number; spent: number; last: string | null }>();
  for (const order of allOrders) {
    if (!order.userId || order.status === 'cancelled') continue;
    const entry = byUser.get(order.userId) ?? { count: 0, spent: 0, last: null };
    entry.count += 1;
    entry.spent += order.totals?.grandTotalPaise ?? 0;
    if (!entry.last || order.createdAt > entry.last) entry.last = order.createdAt;
    byUser.set(order.userId, entry);
  }

  return profiles.map((profile) => {
    const stats = byUser.get(profile.id);
    return {
      uid: profile.id,
      email: profile.email,
      displayName: profile.displayName,
      phone: profile.phone,
      orderCount: stats?.count ?? 0,
      spentPaise: stats?.spent ?? 0,
      lastOrderAt: stats?.last ?? null,
    };
  });
}

// ---------------------------------------------------------------------------
// Admin roles
// ---------------------------------------------------------------------------

export interface AdminRole extends Record<string, unknown> {
  id: string;
  email: string;
  isAdmin: boolean;
  grantedBy: string;
  updatedAt: string;
}

export async function setAdminRole(
  email: string,
  isAdmin: boolean,
  actor: string
): Promise<AdminRole> {
  const db = await getDb();
  const id = email.trim().toLowerCase();

  if (!isAdmin) {
    await db.collection<AdminRole>(COLLECTIONS.adminRoles).delete(id).catch(() => undefined);
  } else {
    await db.collection<AdminRole>(COLLECTIONS.adminRoles).set(id, {
      id,
      email: id,
      isAdmin: true,
      grantedBy: actor,
      updatedAt: new Date().toISOString(),
    });
  }

  return { id, email: id, isAdmin, grantedBy: actor, updatedAt: new Date().toISOString() };
}

export async function listAdminRoles(): Promise<AdminRole[]> {
  const { docs } = await (await getDb())
    .collection<AdminRole>(COLLECTIONS.adminRoles)
    .list();
  return docs;
}