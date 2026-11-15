import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import type { App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };
import { AuthRequest, requireAdmin, requireAuth } from './src/middleware/auth.ts';
import { adjustUserBalanceAndPoints, listAllUsers } from './src/db/users.ts';
import {
  approveDepositRequest,
  createPendingDeposit,
  getAllDepositRequests,
  getRecentAuditLogs,
  getUserDeposits,
  rejectDepositRequest,
} from './src/db/deposits.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK
let firebaseAdminApp: App | null = null;
try {
  firebaseAdminApp = !getApps().length
    ? initializeApp({
        projectId: firebaseConfig.projectId,
      })
    : getApp();
  console.log('[Firebase Admin] Successfully initialized with project:', firebaseConfig.projectId);
} catch (err) {
  console.warn('[Firebase Admin] Initialization notice:', err);
}

// Target the specific Firestore database instance configured in firebase-applet-config.json
const getAdminDb = (): Firestore | null => {
  if (!firebaseAdminApp) return null;
  try {
    return firebaseConfig.firestoreDatabaseId
      ? getFirestore(firebaseAdminApp, firebaseConfig.firestoreDatabaseId)
      : getFirestore(firebaseAdminApp);
  } catch (err) {
    console.error('[Firebase Admin DB] Error accessing Firestore:', err);
    return null;
  }
};

const app = express();
app.use(express.json());

// In-Memory fallback settings cache
const fallbackStore = {
  settings: {
    bkashNumber: '01889-421782',
    nagadNumber: '01712-984321',
    rocketNumber: '01911-345678-9',
    upayNumber: '01622-778899',
    minDeposit: 200,
    maxDeposit: 50000,
    minWithdrawal: 500,
    maxWithdrawal: 25000,
    maintenanceMode: false,
    announcement:
      'স্বাগতম Babu22 ক্যাসিনো ও স্পোর্টসবুকে! বিকাশ ও নগদে ১ মিনিটে ইনস্ট্যান্ট ডিপোজিট ও নিরাপদ উত্তোলন।',
    updatedAt: new Date().toISOString(),
  },
  withdrawalRequests: new Map<string, any>(),
};

// Helper to parse Firestore REST API Document response
function parseFirestoreDoc(doc: any): Record<string, any> {
  if (!doc || !doc.fields) return {};
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(doc.fields as Record<string, any>)) {
    if ('stringValue' in val) result[key] = val.stringValue;
    else if ('integerValue' in val) result[key] = Number(val.integerValue);
    else if ('doubleValue' in val) result[key] = Number(val.doubleValue);
    else if ('booleanValue' in val) result[key] = Boolean(val.booleanValue);
    else if ('nullValue' in val) result[key] = null;
    else if ('mapValue' in val) result[key] = parseFirestoreDoc(val.mapValue);
    else result[key] = val;
  }
  return result;
}

// Fetch live operational settings using Firestore REST endpoint with API Key
async function fetchLiveFirestoreSettings(): Promise<Record<string, any> | null> {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/app_settings/global?key=${firebaseConfig.apiKey}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const parsed = parseFirestoreDoc(data);
      if (parsed && Object.keys(parsed).length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fail silently, fallbackStore will be used
  }
  return null;
}

// -------------------------------------------------------------
// 1. PUBLIC APP SETTINGS API
// -------------------------------------------------------------
app.get('/api/settings', async (_req: Request, res: Response) => {
  try {
    const liveSettings = await fetchLiveFirestoreSettings();
    if (liveSettings) {
      fallbackStore.settings = { ...fallbackStore.settings, ...liveSettings };
      return res.json({ success: true, settings: fallbackStore.settings });
    }

    const db = getAdminDb();
    if (db) {
      const doc = await db.collection('app_settings').doc('global').get();
      if (doc.exists) {
        fallbackStore.settings = { ...fallbackStore.settings, ...doc.data() };
        return res.json({ success: true, settings: fallbackStore.settings });
      }
    }
  } catch {
    // Graceful fallback to cached store
  }
  return res.json({ success: true, settings: fallbackStore.settings });
});

// -------------------------------------------------------------
// 2. AUTHENTICATED USER PROFILE & WALLET SYNC (PostgreSQL)
// -------------------------------------------------------------
app.get('/api/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const dbUser = req.dbUser!;
    const deposits = await getUserDeposits(dbUser.uid);
    return res.json({
      success: true,
      user: dbUser,
      isAdmin: dbUser.role === 'admin',
      deposits,
    });
  } catch (error: any) {
    console.error('Failed to load user profile:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'প্রোফাইল লোড করতে সমস্যা হয়েছে।',
    });
  }
});

app.post('/api/wallet/sync', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const deltaAmount = Number(req.body?.deltaAmount || 0);
    const vipPointsDelta = Number(req.body?.vipPointsDelta || 0);

    if (Number.isNaN(deltaAmount) || Number.isNaN(vipPointsDelta)) {
      return res.status(400).json({ success: false, message: 'অবৈধ ব্যালেন্স মান।' });
    }

    const updatedUser = await adjustUserBalanceAndPoints(
      req.user!.uid,
      deltaAmount,
      Math.max(0, Math.round(vipPointsDelta))
    );

    return res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Failed to sync wallet:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'ওয়ালেট সিঙ্ক ব্যর্থ হয়েছে।',
    });
  }
});

// -------------------------------------------------------------
// 3. DEPOSIT REQUEST API (Saves as 'pending' in PostgreSQL)
// -------------------------------------------------------------
app.post('/api/deposit/request', requireAuth, async (req: AuthRequest, res: Response) => {
  const { method = 'bkash', amount, senderNumber = '', trxId } = req.body;
  const dbUser = req.dbUser!;

  if (!amount || !trxId) {
    return res.status(400).json({
      success: false,
      message: 'অনুগ্রহ করে Amount এবং Transaction ID সঠিকভাবে পূরণ করুন!',
    });
  }

  const numAmount = Number(amount);
  const minDeposit = fallbackStore.settings.minDeposit || 200;
  const maxDeposit = fallbackStore.settings.maxDeposit || 50000;

  if (Number.isNaN(numAmount) || numAmount < minDeposit) {
    return res.status(400).json({
      success: false,
      message: `নূন্যতম ডিপোজিট ৳${minDeposit}!`,
    });
  }
  if (numAmount > maxDeposit) {
    return res.status(400).json({
      success: false,
      message: `সর্বোচ্চ ডিপোজিট ৳${maxDeposit}!`,
    });
  }

  const cleanTrx = String(trxId).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleanTrx.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'লেনদেনের সঠিক ট্রানজেকশন আইডি (Transaction ID) দিন (নূন্যতম ৬ অক্ষর)!',
    });
  }

  try {
    const deposit = await createPendingDeposit({
      userId: dbUser.id,
      userUid: dbUser.uid,
      userEmail: dbUser.email,
      username: dbUser.username,
      method: String(method),
      amount: numAmount,
      senderNumber: String(senderNumber || '').trim(),
      trxId: cleanTrx,
    });

    return res.json({
      success: true,
      message:
        'আপনার ডিপোজিট রিকোয়েস্ট "Pending" হিসেবে ডাটাবেসে সেভ হয়েছে! অ্যাডমিন Approve করলে আপনার ব্যালেন্স অটোমেটিক বেড়ে যাবে।',
      deposit,
    });
  } catch (err: any) {
    if (err?.message === 'DUPLICATE_TRX_ID') {
      return res.status(400).json({
        success: false,
        error: 'DUPLICATE_TRX_ID',
        message: `এই Transaction ID (${cleanTrx}) ইতিপূর্বে ব্যবহার করা হয়েছে! প্রতিটি TrxID শুধুমাত্র একবার ব্যবহার করা যাবে।`,
      });
    }
    console.error('[Deposit Request Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'ডিপোজিট রিকোয়েস্ট সেভ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
    });
  }
});

app.get('/api/deposits/my', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const deposits = await getUserDeposits(req.user!.uid);
    return res.json({ success: true, deposits });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || 'ডিপোজিট তালিকা লোড করতে ব্যর্থ।',
    });
  }
});

// -------------------------------------------------------------
// 4. SECURE ADMIN PANEL API (Firebase Auth + Role Verified)
// -------------------------------------------------------------
app.get('/api/admin/overview', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const statusFilter = typeof req.query.status === 'string' ? req.query.status : undefined;
    const [deposits, allDeposits, usersList, auditLogs] = await Promise.all([
      getAllDepositRequests(statusFilter),
      getAllDepositRequests(),
      listAllUsers(),
      getRecentAuditLogs(),
    ]);

    const pendingDeposits = allDeposits.filter((d) => d.status === 'pending');
    const approvedDeposits = allDeposits.filter((d) => d.status === 'approved');
    const rejectedDeposits = allDeposits.filter((d) => d.status === 'rejected');

    return res.json({
      success: true,
      deposits,
      users: usersList,
      auditLogs,
      stats: {
        pendingCount: pendingDeposits.length,
        approvedCount: approvedDeposits.length,
        rejectedCount: rejectedDeposits.length,
        totalPendingAmount: pendingDeposits.reduce((sum, d) => sum + Number(d.amount || 0), 0),
        totalApprovedAmount: approvedDeposits.reduce((sum, d) => sum + Number(d.amount || 0), 0),
        totalUsers: usersList.length,
      },
    });
  } catch (error: any) {
    console.error('[Admin Overview Error]:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'অ্যাডমিন ডেটা লোড করতে সমস্যা হয়েছে।',
    });
  }
});

app.post('/api/admin/deposits/:id/approve', requireAdmin, async (req: AuthRequest, res: Response) => {
  const depositId = Number(req.params.id);
  if (!Number.isInteger(depositId) || depositId <= 0) {
    return res.status(400).json({ success: false, message: 'অবৈধ ডিপোজিট আইডি।' });
  }

  try {
    const result = await approveDepositRequest(
      depositId,
      req.user!.uid,
      req.user!.email || 'admin@babu22.vip'
    );

    return res.json({
      success: true,
      message: `৳${result.deposit.amount} ডিপোজিট Approve করা হয়েছে এবং ${result.user.username}-এর ব্যালেন্স বেড়ে ৳${result.user.balance.toFixed(2)} হয়েছে!`,
      deposit: result.deposit,
      user: result.user,
    });
  } catch (error: any) {
    if (error?.message === 'DEPOSIT_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'ডিপোজিট রিকোয়েস্ট পাওয়া যায়নি।' });
    }
    if (error?.message === 'ALREADY_PROCESSED') {
      return res.status(409).json({
        success: false,
        message: 'এই রিকোয়েস্টটি ইতিপূর্বে প্রসেস করা হয়েছে!',
      });
    }
    console.error('[Admin Approve Error]:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'ডিপোজিট Approve করতে ব্যর্থ।',
    });
  }
});

app.post('/api/admin/deposits/:id/reject', requireAdmin, async (req: AuthRequest, res: Response) => {
  const depositId = Number(req.params.id);
  if (!Number.isInteger(depositId) || depositId <= 0) {
    return res.status(400).json({ success: false, message: 'অবৈধ ডিপোজিট আইডি।' });
  }

  try {
    const reason = typeof req.body?.reason === 'string' ? req.body.reason : undefined;
    const deposit = await rejectDepositRequest(
      depositId,
      req.user!.uid,
      req.user!.email || 'admin@babu22.vip',
      reason
    );

    return res.json({
      success: true,
      message: `TrxID ${deposit.trxId} রিকোয়েস্ট Reject করা হয়েছে।`,
      deposit,
    });
  } catch (error: any) {
    if (error?.message === 'DEPOSIT_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'ডিপোজিট রিকোয়েস্ট পাওয়া যায়নি।' });
    }
    if (error?.message === 'ALREADY_PROCESSED') {
      return res.status(409).json({
        success: false,
        message: 'এই রিকোয়েস্টটি ইতিপূর্বে প্রসেস করা হয়েছে!',
      });
    }
    console.error('[Admin Reject Error]:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'ডিপোজিট Reject করতে ব্যর্থ।',
    });
  }
});

// -------------------------------------------------------------
// 5. WITHDRAWAL REQUEST API
// -------------------------------------------------------------
app.post('/api/withdraw/request', async (req: Request, res: Response) => {
  const { userId, userEmail, username, method, amount, accountNumber } = req.body;

  if (!userId || !method || !amount || !accountNumber) {
    return res.status(400).json({ success: false, message: 'সব তথ্য দিন!' });
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount < 500) {
    return res.status(400).json({ success: false, message: 'নূন্যতম উত্তোলন ৫০০ টাকা!' });
  }

  const requestId = `wth-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const withdrawalRecord = {
    id: requestId,
    userId,
    userEmail: userEmail || '',
    username: username || 'খেলোয়াড়',
    method,
    amount: numAmount,
    accountNumber,
    status: 'pending',
    createdAt: now,
  };
  fallbackStore.withdrawalRequests.set(requestId, withdrawalRecord);

  return res.json({
    success: true,
    message: 'উত্তোলন আবেদন জমা হয়েছে (প্রক্রিয়াধীন)।',
    withdrawal: withdrawalRecord,
  });
});

// -------------------------------------------------------------
// VITE DEV SERVER INTEGRATION (PORT 3000)
// -------------------------------------------------------------
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Babu22 Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Boot Error:', err);
});
