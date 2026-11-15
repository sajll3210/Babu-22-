import { desc, eq, sql } from 'drizzle-orm';
import { db } from './index.ts';
import { users } from './schema.ts';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'sajol3210@gmail.com').toLowerCase();

function computeVipTier(points: number): string {
  if (points >= 5000) return 'ডায়মন্ড';
  if (points >= 2000) return 'প্লাটিনাম';
  if (points >= 750) return 'গোল্ড';
  if (points >= 200) return 'সিলভার';
  return 'ব্রোঞ্জ';
}

export async function getOrCreateUser(
  uid: string,
  email: string,
  username?: string,
  emailVerified = false
) {
  try {
    const normalizedEmail = email.toLowerCase();
    const isAdminAccount = normalizedEmail === ADMIN_EMAIL && emailVerified;
    const cleanUsername = (username || normalizedEmail.split('@')[0] || 'খেলোয়াড়').slice(0, 64);

    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (existing.length > 0) {
      const current = existing[0];
      if (isAdminAccount && current.role !== 'admin') {
        const [promoted] = await db
          .update(users)
          .set({ role: 'admin', email: normalizedEmail, updatedAt: new Date() })
          .where(eq(users.uid, uid))
          .returning();
        return promoted;
      }
      return current;
    }

    const result = await db
      .insert(users)
      .values({
        uid,
        email: normalizedEmail,
        username: cleanUsername,
        role: isAdminAccount ? 'admin' : 'user',
        balance: 0,
        bonusBalance: 0,
        totalWon: 0,
        totalBet: 0,
        vipPoints: 0,
        vipTier: 'ব্রোঞ্জ',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: normalizedEmail,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Failed to load or create user profile.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Database query failed in getUserByUid:', error);
    throw new Error('Failed to fetch user profile.', { cause: error });
  }
}

export async function listAllUsers() {
  try {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  } catch (error) {
    console.error('Database query failed in listAllUsers:', error);
    throw new Error('Failed to fetch user accounts.', { cause: error });
  }
}

export async function adjustUserBalanceAndPoints(
  uid: string,
  deltaAmount: number,
  vipPointsDelta = 0
) {
  try {
    return await db.transaction(async (tx) => {
      const [current] = await tx.select().from(users).where(eq(users.uid, uid)).limit(1);
      if (!current) {
        throw new Error('USER_NOT_FOUND');
      }

      const nextBalance = Math.max(0, Number((current.balance + deltaAmount).toFixed(2)));
      const nextWon = deltaAmount > 0 ? Number((current.totalWon + deltaAmount).toFixed(2)) : current.totalWon;
      const nextBet = deltaAmount < 0 ? Number((current.totalBet + Math.abs(deltaAmount)).toFixed(2)) : current.totalBet;
      const nextPoints = Math.max(0, current.vipPoints + vipPointsDelta);
      const nextTier = computeVipTier(nextPoints);

      const [updated] = await tx
        .update(users)
        .set({
          balance: nextBalance,
          totalWon: nextWon,
          totalBet: nextBet,
          vipPoints: nextPoints,
          vipTier: nextTier,
          updatedAt: new Date(),
        })
        .where(eq(users.uid, uid))
        .returning();

      return updated;
    });
  } catch (error: any) {
    if (error?.message === 'USER_NOT_FOUND') throw error;
    console.error('Database query failed in adjustUserBalanceAndPoints:', error);
    throw new Error('Failed to update user balance.', { cause: error });
  }
}

export async function creditUserBalanceById(userId: number, amount: number, vipPointsToAdd: number) {
  try {
    const [updated] = await db
      .update(users)
      .set({
        balance: sql`${users.balance} + ${amount}`,
        vipPoints: sql`${users.vipPoints} + ${vipPointsToAdd}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  } catch (error) {
    console.error('Database query failed in creditUserBalanceById:', error);
    throw new Error('Failed to credit user balance.', { cause: error });
  }
}
