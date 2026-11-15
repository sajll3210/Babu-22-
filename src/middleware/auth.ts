import { Request, Response, NextFunction } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateUser } from '../db/users.ts';

export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'sajol3210@gmail.com').toLowerCase();

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: {
    id: number;
    uid: string;
    email: string;
    username: string;
    role: string;
    balance: number;
    bonusBalance: number;
    totalWon: number;
    totalBet: number;
    vipPoints: number;
    vipTier: string;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing bearer token',
      message: 'অনুগ্রহ করে প্রথমে Google অ্যাকাউন্ট দিয়ে সাইন ইন করুন।',
    });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;

    const email = (decodedToken.email || '').toLowerCase();
    const displayName =
      typeof decodedToken.name === 'string' && decodedToken.name.trim()
        ? decodedToken.name.trim()
        : email.split('@')[0] || 'খেলোয়াড়';

    const dbUser = await getOrCreateUser(
      decodedToken.uid,
      email || `${decodedToken.uid}@babu22.local`,
      displayName,
      Boolean(decodedToken.email_verified)
    );
    req.dbUser = dbUser;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid token',
      message: 'সেশন মেয়াদোত্তীর্ণ হয়েছে, অনুগ্রহ করে আবার সাইন ইন করুন।',
    });
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  await requireAuth(req, res, () => {
    const email = (req.user?.email || '').toLowerCase();
    const isVerifiedAdminEmail = email === ADMIN_EMAIL && Boolean(req.user?.email_verified);
    const hasAdminRole = req.dbUser?.role === 'admin';

    if (!isVerifiedAdminEmail && !hasAdminRole) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Admin access required',
        message: 'সিকিউর অ্যাডমিন প্যানেলে প্রবেশের অনুমতি আপনার নেই।',
      });
    }

    next();
  });
};
