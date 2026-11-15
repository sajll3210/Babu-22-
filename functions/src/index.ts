import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const app = !admin.apps.length ? admin.initializeApp() : admin.app();
const databaseId = process.env.FIRESTORE_DATABASE_ID || 'ai-studio-babu22-72a404e1-1a73-4d34-b567-358092ff4f67';
const db = getFirestore(app, databaseId);

/**
 * Callable Function: Submit Deposit Request
 * Reserves the Transaction ID atomically in Firestore.
 */
export const submitDepositRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  const { method, amount, senderNumber, trxId } = data;
  const userId = context.auth.uid;
  const userEmail = context.auth.token.email || '';
  const numAmount = Number(amount);

  if (!method || !numAmount || numAmount < 200 || !senderNumber || !trxId) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid deposit parameters');
  }

  const cleanTrx = String(trxId).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleanTrx.length < 6) {
    throw new functions.https.HttpsError('invalid-argument', 'TrxID must be at least 6 characters');
  }

  const requestId = `dep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = FieldValue.serverTimestamp();

  return await db.runTransaction(async (transaction) => {
    const reservedRef = db.collection('reserved_trx_ids').doc(cleanTrx);
    const reservedDoc = await transaction.get(reservedRef);

    if (reservedDoc.exists) {
      throw new functions.https.HttpsError(
        'already-exists',
        'This Transaction ID has already been submitted and cannot be reused.'
      );
    }

    transaction.set(reservedRef, {
      trxId: cleanTrx,
      userId,
      depositId: requestId,
      reservedAt: now,
    });

    const depositRef = db.collection('deposit_requests').doc(requestId);
    const depositData = {
      id: requestId,
      userId,
      userEmail,
      method,
      amount: numAmount,
      senderNumber,
      trxId: cleanTrx,
      status: 'pending',
      createdAt: now,
    };
    transaction.set(depositRef, depositData);

    return { success: true, requestId, trxId: cleanTrx };
  });
});

/**
 * Callable Function: Submit Withdrawal Request
 * Reserves the requested amount atomically from the user's available balance.
 */
export const submitWithdrawalRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  const { method, amount, accountNumber } = data;
  const userId = context.auth.uid;
  const numAmount = Number(amount);

  if (!method || !numAmount || numAmount < 500 || !accountNumber) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid withdrawal parameters');
  }

  const requestId = `wth-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = FieldValue.serverTimestamp();

  return await db.runTransaction(async (transaction) => {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await transaction.get(userRef);

    const currentBal = userDoc.exists ? (userDoc.data()?.balance || 0) : 0;
    if (currentBal < numAmount) {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient balance');
    }

    const currentReserved = userDoc.exists ? (userDoc.data()?.reservedBalance || 0) : 0;
    transaction.set(userRef, {
      balance: +(currentBal - numAmount).toFixed(2),
      reservedBalance: +(currentReserved + numAmount).toFixed(2),
      updatedAt: now,
    }, { merge: true });

    const wthRef = db.collection('withdrawal_requests').doc(requestId);
    transaction.set(wthRef, {
      id: requestId,
      userId,
      userEmail: context.auth.token.email || '',
      method,
      amount: numAmount,
      accountNumber,
      status: 'pending',
      createdAt: now,
    });

    return { success: true, requestId, newBalance: +(currentBal - numAmount).toFixed(2) };
  });
});

/**
 * Callable Function: Admin Deposit Approval/Rejection
 * Verified by server custom claim. Atomically credits balance on approval.
 */
export const adminProcessDeposit = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.admin !== true) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { depositId, action, verifiedAgainstStatement, rejectionReason } = data;
  if (!depositId || !['approve', 'reject'].includes(action)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid action');
  }

  if (action === 'approve' && !verifiedAgainstStatement) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Admin must confirm payment was verified against account statement'
    );
  }

  const now = FieldValue.serverTimestamp();

  return await db.runTransaction(async (transaction) => {
    const depRef = db.collection('deposit_requests').doc(depositId);
    const depDoc = await transaction.get(depRef);

    if (!depDoc.exists) throw new functions.https.HttpsError('not-found', 'Deposit not found');
    const depData = depDoc.data()!;
    if (depData.status !== 'pending') {
      throw new functions.https.HttpsError('failed-precondition', 'Request already processed');
    }

    if (action === 'approve') {
      const userRef = db.collection('users').doc(depData.userId);
      const userDoc = await transaction.get(userRef);
      const currentBal = userDoc.exists ? (userDoc.data()?.balance || 0) : 0;
      const currentPts = userDoc.exists ? (userDoc.data()?.vipPoints || 0) : 0;
      const vipEarned = Math.max(10, Math.round(depData.amount / 20));

      transaction.set(userRef, {
        balance: +(currentBal + depData.amount).toFixed(2),
        vipPoints: currentPts + vipEarned,
        updatedAt: now,
      }, { merge: true });

      transaction.update(depRef, {
        status: 'approved',
        reviewedAt: now,
        reviewedBy: context.auth.token.email || context.auth.uid,
        verifiedAgainstStatement: true,
      });

      const auditRef = db.collection('admin_audit_logs').doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        adminUid: context.auth.uid,
        adminEmail: context.auth.token.email || '',
        action: 'DEPOSIT_APPROVED',
        targetId: depositId,
        details: `Approved ৳${depData.amount} for user ${depData.userId} (TrxID: ${depData.trxId})`,
        timestamp: now,
      });
    } else {
      transaction.update(depRef, {
        status: 'rejected',
        reviewedAt: now,
        reviewedBy: context.auth.token.email || context.auth.uid,
        rejectionReason: rejectionReason || 'Statement verification failed',
      });

      const auditRef = db.collection('admin_audit_logs').doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        adminUid: context.auth.uid,
        adminEmail: context.auth.token.email || '',
        action: 'DEPOSIT_REJECTED',
        targetId: depositId,
        details: `Rejected deposit ৳${depData.amount} (TrxID: ${depData.trxId})`,
        timestamp: now,
      });
    }

    return { success: true };
  });
});

/**
 * Callable Function: Admin Withdrawal Process (Complete or Reject with Refund)
 */
export const adminProcessWithdrawal = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.admin !== true) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { withdrawalId, action, payoutReference, rejectionReason } = data;
  if (!withdrawalId || !['approve', 'reject'].includes(action)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid action');
  }

  const now = FieldValue.serverTimestamp();

  return await db.runTransaction(async (transaction) => {
    const wthRef = db.collection('withdrawal_requests').doc(withdrawalId);
    const wthDoc = await transaction.get(wthRef);

    if (!wthDoc.exists) throw new functions.https.HttpsError('not-found', 'Withdrawal not found');
    const wthData = wthDoc.data()!;
    if (wthData.status !== 'pending') {
      throw new functions.https.HttpsError('failed-precondition', 'Request already processed');
    }

    const userRef = db.collection('users').doc(wthData.userId);
    const userDoc = await transaction.get(userRef);

    if (action === 'approve') {
      if (userDoc.exists) {
        const curReserved = userDoc.data()?.reservedBalance || 0;
        transaction.update(userRef, {
          reservedBalance: Math.max(0, +(curReserved - wthData.amount).toFixed(2)),
          updatedAt: now,
        });
      }

      transaction.update(wthRef, {
        status: 'completed',
        processedAt: now,
        processedBy: context.auth.token.email || context.auth.uid,
        payoutReference: payoutReference || 'MANUAL_PAYOUT_CONFIRMED',
      });

      const auditRef = db.collection('admin_audit_logs').doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        adminUid: context.auth.uid,
        adminEmail: context.auth.token.email || '',
        action: 'WITHDRAWAL_COMPLETED',
        targetId: withdrawalId,
        details: `Completed payout of ৳${wthData.amount} to ${wthData.accountNumber}`,
        timestamp: now,
      });
    } else {
      // ATOMIC REFUND
      if (userDoc.exists) {
        const curBal = userDoc.data()?.balance || 0;
        const curReserved = userDoc.data()?.reservedBalance || 0;
        transaction.update(userRef, {
          balance: +(curBal + wthData.amount).toFixed(2),
          reservedBalance: Math.max(0, +(curReserved - wthData.amount).toFixed(2)),
          updatedAt: now,
        });
      }

      transaction.update(wthRef, {
        status: 'rejected',
        processedAt: now,
        processedBy: context.auth.token.email || context.auth.uid,
        rejectionReason: rejectionReason || 'Payout rejected by admin',
      });

      const auditRef = db.collection('admin_audit_logs').doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        adminUid: context.auth.uid,
        adminEmail: context.auth.token.email || '',
        action: 'WITHDRAWAL_REJECTED_REFUNDED',
        targetId: withdrawalId,
        details: `Refunded ৳${wthData.amount} for user ${wthData.userId}`,
        timestamp: now,
      });
    }

    return { success: true };
  });
});
