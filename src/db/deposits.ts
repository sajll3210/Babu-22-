import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from './index.ts';
import { adminAuditLogs, depositRequests, users } from './schema.ts';

function computeVipTier(points: number): string {
  if (points >= 5000) return 'ডায়মন্ড';
  if (points >= 2000) return 'প্লাটিনাম';
  if (points >= 750) return 'গোল্ড';
  if (points >= 200) return 'সিলভার';
  return 'ব্রোঞ্জ';
}

export interface CreatePendingDepositInput {
  userId: number;
  userUid: string;
  userEmail: string;
  username: string;
  method: string;
  amount: number;
  senderNumber: string;
  trxId: string;
}

export async function createPendingDeposit(input: CreatePendingDepositInput) {
  try {
    const cleanTrx = input.trxId.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const existing = await db
      .select({ id: depositRequests.id })
      .from(depositRequests)
      .where(eq(depositRequests.trxId, cleanTrx))
      .limit(1);

    if (existing.length > 0) {
      throw new Error('DUPLICATE_TRX_ID');
    }

    const requestCode = `DEP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const [created] = await db
      .insert(depositRequests)
      .values({
        requestCode,
        userId: input.userId,
        userUid: input.userUid,
        userEmail: input.userEmail,
        username: input.username,
        method: input.method,
        amount: input.amount,
        senderNumber: input.senderNumber,
        trxId: cleanTrx,
        status: 'pending',
      })
      .returning();

    return created;
  } catch (error: any) {
    if (error?.message === 'DUPLICATE_TRX_ID') {
      throw error;
    }
    if (error?.code === '23505') {
      throw new Error('DUPLICATE_TRX_ID');
    }
    console.error('Database query failed in createPendingDeposit:', error);
    throw new Error('Failed to submit pending deposit request.', { cause: error });
  }
}

export async function getUserDeposits(userUid: string) {
  try {
    return await db
      .select()
      .from(depositRequests)
      .where(eq(depositRequests.userUid, userUid))
      .orderBy(desc(depositRequests.createdAt));
  } catch (error) {
    console.error('Database query failed in getUserDeposits:', error);
    throw new Error('Failed to fetch your deposit history.', { cause: error });
  }
}

export async function getAllDepositRequests(statusFilter?: string) {
  try {
    if (statusFilter && ['pending', 'approved', 'rejected'].includes(statusFilter)) {
      return await db
        .select()
        .from(depositRequests)
        .where(eq(depositRequests.status, statusFilter))
        .orderBy(desc(depositRequests.createdAt));
    }
    return await db
      .select()
      .from(depositRequests)
      .orderBy(desc(depositRequests.createdAt));
  } catch (error) {
    console.error('Database query failed in getAllDepositRequests:', error);
    throw new Error('Failed to fetch deposit requests.', { cause: error });
  }
}

export async function approveDepositRequest(
  depositId: number,
  adminUid: string,
  adminEmail: string
) {
  try {
    return await db.transaction(async (tx) => {
      // Atomically transition status from pending -> approved so it can never be double-credited
      const [approved] = await tx
        .update(depositRequests)
        .set({
          status: 'approved',
          reviewedBy: adminEmail,
          reviewedAt: new Date(),
        })
        .where(
          and(
            eq(depositRequests.id, depositId),
            eq(depositRequests.status, 'pending')
          )
        )
        .returning();

      if (!approved) {
        const existing = await tx
          .select()
          .from(depositRequests)
          .where(eq(depositRequests.id, depositId))
          .limit(1);
        if (existing.length === 0) {
          throw new Error('DEPOSIT_NOT_FOUND');
        }
        throw new Error('ALREADY_PROCESSED');
      }

      const vipPointsToAdd = Math.max(10, Math.round(approved.amount / 20));

      const [userRow] = await tx
        .select()
        .from(users)
        .where(eq(users.id, approved.userId))
        .limit(1);

      if (!userRow) {
        throw new Error('USER_NOT_FOUND');
      }

      const nextPoints = userRow.vipPoints + vipPointsToAdd;
      const nextTier = computeVipTier(nextPoints);

      const [updatedUser] = await tx
        .update(users)
        .set({
          balance: sql`${users.balance} + ${approved.amount}`,
          vipPoints: nextPoints,
          vipTier: nextTier,
          updatedAt: new Date(),
        })
        .where(eq(users.id, approved.userId))
        .returning();

      await tx.insert(adminAuditLogs).values({
        adminUid,
        adminEmail,
        action: 'DEPOSIT_APPROVED',
        targetRequestId: approved.id,
        targetUserUid: approved.userUid,
        amount: approved.amount,
        details: `Approved ${approved.method} TrxID ${approved.trxId} (+৳${approved.amount}) for ${approved.username}`,
      });

      return { deposit: approved, user: updatedUser };
    });
  } catch (error: any) {
    if (
      error?.message === 'DEPOSIT_NOT_FOUND' ||
      error?.message === 'ALREADY_PROCESSED' ||
      error?.message === 'USER_NOT_FOUND'
    ) {
      throw error;
    }
    console.error('Database query failed in approveDepositRequest:', error);
    throw new Error('Failed to approve deposit request.', { cause: error });
  }
}

export async function rejectDepositRequest(
  depositId: number,
  adminUid: string,
  adminEmail: string,
  reason?: string
) {
  try {
    return await db.transaction(async (tx) => {
      const [rejected] = await tx
        .update(depositRequests)
        .set({
          status: 'rejected',
          reviewedBy: adminEmail,
          rejectionReason: (reason || 'Transaction ID যাচাই করা যায়নি').slice(0, 200),
          reviewedAt: new Date(),
        })
        .where(
          and(
            eq(depositRequests.id, depositId),
            eq(depositRequests.status, 'pending')
          )
        )
        .returning();

      if (!rejected) {
        const existing = await tx
          .select()
          .from(depositRequests)
          .where(eq(depositRequests.id, depositId))
          .limit(1);
        if (existing.length === 0) {
          throw new Error('DEPOSIT_NOT_FOUND');
        }
        throw new Error('ALREADY_PROCESSED');
      }

      await tx.insert(adminAuditLogs).values({
        adminUid,
        adminEmail,
        action: 'DEPOSIT_REJECTED',
        targetRequestId: rejected.id,
        targetUserUid: rejected.userUid,
        amount: rejected.amount,
        details: `Rejected ${rejected.method} TrxID ${rejected.trxId} (৳${rejected.amount}): ${rejected.rejectionReason}`,
      });

      return rejected;
    });
  } catch (error: any) {
    if (error?.message === 'DEPOSIT_NOT_FOUND' || error?.message === 'ALREADY_PROCESSED') {
      throw error;
    }
    console.error('Database query failed in rejectDepositRequest:', error);
    throw new Error('Failed to reject deposit request.', { cause: error });
  }
}

export async function getRecentAuditLogs() {
  try {
    return await db
      .select()
      .from(adminAuditLogs)
      .orderBy(desc(adminAuditLogs.createdAt))
      .limit(50);
  } catch (error) {
    console.error('Database query failed in getRecentAuditLogs:', error);
    throw new Error('Failed to fetch admin audit logs.', { cause: error });
  }
}
