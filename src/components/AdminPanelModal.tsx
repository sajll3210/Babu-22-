import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Users,
  FileText,
  Wallet,
  Search,
  AlertTriangle,
  LogIn,
  LogOut,
  Check,
  Ban,
} from 'lucide-react';
import { FirebaseUser } from '../firebase';
import { sound } from '../utils/audio';

export interface PostgresDepositRecord {
  id: number;
  requestCode: string;
  userId: number;
  userUid: string;
  userEmail: string;
  username: string;
  method: string;
  amount: number;
  senderNumber: string;
  trxId: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}

interface PostgresUserRecord {
  id: number;
  uid: string;
  email: string;
  username: string;
  role: string;
  balance: number;
  vipPoints: number;
  vipTier: string;
  createdAt: string;
}

interface PostgresAuditLog {
  id: number;
  adminUid: string;
  adminEmail: string;
  action: string;
  targetRequestId: number;
  targetUserUid: string;
  amount: number;
  details: string;
  createdAt: string;
}

interface AdminStats {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalPendingAmount: number;
  totalApprovedAmount: number;
  totalUsers: number;
}

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  firebaseUser: FirebaseUser | null;
  onSignInWithGoogle: () => Promise<void>;
  onSignOutGoogle: () => Promise<void>;
  onApprovedSuccess: (message: string) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  firebaseUser,
  onSignInWithGoogle,
  onSignOutGoogle,
  onApprovedSuccess,
}) => {
  const [activeSection, setActiveSection] = useState<'deposits' | 'users' | 'logs'>('deposits');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  const [deposits, setDeposits] = useState<PostgresDepositRecord[]>([]);
  const [usersList, setUsersList] = useState<PostgresUserRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<PostgresAuditLog[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalPendingAmount: 0,
    totalApprovedAmount: 0,
    totalUsers: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const [actionBanner, setActionBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const fetchOverview = useCallback(async () => {
    if (!firebaseUser) return;
    setIsLoading(true);
    setErrorMsg(null);
    setIsForbidden(false);

    try {
      const token = await firebaseUser.getIdToken();
      const query = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await fetch(`/api/admin/overview${query}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.status === 403) {
        setIsForbidden(true);
        setErrorMsg(data.message || 'সিকিউর অ্যাডমিন প্যানেলে প্রবেশের অনুমতি নেই।');
        setIsLoading(false);
        return;
      }

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'ডেটা লোড করতে সমস্যা হয়েছে।');
        setIsLoading(false);
        return;
      }

      setDeposits(data.deposits || []);
      setUsersList(data.users || []);
      setAuditLogs(data.auditLogs || []);
      if (data.stats) setStats(data.stats);
    } catch {
      setErrorMsg('সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।');
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUser, statusFilter]);

  useEffect(() => {
    if (isOpen && firebaseUser) {
      fetchOverview();
    }
  }, [isOpen, firebaseUser, fetchOverview]);

  if (!isOpen) return null;

  const handleApprove = async (deposit: PostgresDepositRecord) => {
    if (!firebaseUser || processingId !== null) return;
    setProcessingId(deposit.id);
    setActionBanner(null);
    sound.playClick();

    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/admin/deposits/${deposit.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionBanner({ type: 'error', text: data.message || 'Approve ব্যর্থ হয়েছে।' });
        sound.playCrash();
        return;
      }

      sound.playWinChime();
      setActionBanner({ type: 'success', text: data.message });
      onApprovedSuccess(data.message);
      await fetchOverview();
    } catch {
      setActionBanner({ type: 'error', text: 'সার্ভার ত্রুটির কারণে Approve করা যায়নি।' });
      sound.playCrash();
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (deposit: PostgresDepositRecord) => {
    if (!firebaseUser || processingId !== null) return;
    setProcessingId(deposit.id);
    setActionBanner(null);
    sound.playClick();

    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/admin/deposits/${deposit.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: 'Transaction ID সঠিক পাওয়া যায়নি' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionBanner({ type: 'error', text: data.message || 'Reject ব্যর্থ হয়েছে।' });
        sound.playCrash();
        return;
      }

      setActionBanner({ type: 'success', text: data.message });
      await fetchOverview();
    } catch {
      setActionBanner({ type: 'error', text: 'সার্ভার ত্রুটির কারণে Reject করা যায়নি।' });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredDeposits = deposits.filter((d) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      d.trxId.toLowerCase().includes(q) ||
      d.username.toLowerCase().includes(q) ||
      d.userEmail.toLowerCase().includes(q) ||
      d.requestCode.toLowerCase().includes(q)
    );
  });

  const formatTime = (iso: string) => {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#0b101b] border border-amber-500/30 rounded-3xl max-w-5xl w-full p-4 sm:p-6 text-white shadow-2xl relative my-auto max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-slate-900 hover:bg-slate-800 transition-colors"
          aria-label="Close Admin Panel"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-800 pr-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                সিকিউর অ্যাডমিন প্যানেল (Admin Panel)
              </h2>
              <p className="text-xs text-gray-400">
                Pending ডিপোজিট রিকোয়েস্ট যাচাই করে Approve করলে ইউজারের ব্যালেন্স অটোমেটিক বেড়ে যাবে
              </p>
            </div>
          </div>

          {firebaseUser && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-xl font-mono truncate max-w-[200px]">
                {firebaseUser.email}
              </span>
              <button
                type="button"
                onClick={fetchOverview}
                disabled={isLoading}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-gray-700 text-amber-400 transition-colors"
                title="রিফ্রেশ করুন"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Gate 1: Not Signed In */}
        {!firebaseUser ? (
          <div className="py-12 px-4 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">অ্যাডমিন অথেনটিকেশন প্রয়োজন</h3>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              সিকিউর অ্যাডমিন প্যানেলে প্রবেশ করতে অনুগ্রহ করে আপনার অনুমোদিত Google অ্যাডমিন অ্যাকাউন্ট দিয়ে সাইন ইন করুন।
            </p>
            <button
              type="button"
              onClick={onSignInWithGoogle}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4 stroke-[2.5]" />
              <span>Google দিয়ে অ্যাডমিন সাইন ইন করুন</span>
            </button>
          </div>
        ) : isForbidden ? (
          /* Gate 2: Signed In but Not Admin */
          <div className="py-12 px-4 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-rose-300">প্রবেশাধিকার সংরক্ষিত (Access Denied)</h3>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              বর্তমান অ্যাকাউন্ট (<span className="text-white font-mono">{firebaseUser.email}</span>) অ্যাডমিন হিসেবে অনুমোদিত নয়। অনুগ্রহ করে অনুমোদিত অ্যাডমিন অ্যাকাউন্ট দিয়ে সাইন ইন করুন।
            </p>
            <button
              type="button"
              onClick={async () => {
                await onSignOutGoogle();
                await onSignInWithGoogle();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-gray-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>অন্য Google অ্যাকাউন্ট দিয়ে সাইন ইন করুন</span>
            </button>
          </div>
        ) : (
          /* Gate 3: Verified Admin Dashboard */
          <div className="flex-1 flex flex-col min-h-0 mt-4 space-y-4 overflow-hidden">
            {/* Summary Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30">
                <div className="text-[11px] text-amber-300 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Pending রিকোয়েস্ট
                </div>
                <div className="text-xl font-black text-amber-400 font-mono mt-1 tabular-nums">
                  {stats.pendingCount} টি
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900 border border-gray-800">
                <div className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-amber-400" /> Pending পরিমাণ
                </div>
                <div className="text-xl font-black text-white font-mono mt-1 tabular-nums">
                  ৳{stats.totalPendingAmount.toLocaleString('en-US')}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30">
                <div className="text-[11px] text-emerald-300 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> মোট Approved
                </div>
                <div className="text-xl font-black text-emerald-400 font-mono mt-1 tabular-nums">
                  ৳{stats.totalApprovedAmount.toLocaleString('en-US')}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-900 border border-gray-800">
                <div className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-400" /> মোট ইউজার
                </div>
                <div className="text-xl font-black text-sky-400 font-mono mt-1 tabular-nums">
                  {stats.totalUsers} জন
                </div>
              </div>
            </div>

            {/* Action Banner */}
            {actionBanner && (
              <div
                role="status"
                className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
                  actionBanner.type === 'success'
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                }`}
              >
                {actionBanner.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{actionBanner.text}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Main Section Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveSection('deposits')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeSection === 'deposits'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-900 text-gray-300 hover:bg-slate-800 border border-gray-800'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>ডিপোজিট রিকোয়েস্ট ({stats.pendingCount} Pending)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('users')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeSection === 'users'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-900 text-gray-300 hover:bg-slate-800 border border-gray-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>ইউজার ব্যালেন্স ({usersList.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('logs')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeSection === 'logs'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-900 text-gray-300 hover:bg-slate-800 border border-gray-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>অডিট লগ ({auditLogs.length})</span>
                </button>
              </div>

              {activeSection === 'deposits' && (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-gray-800">
                    {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatusFilter(st)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-colors cursor-pointer ${
                          statusFilter === st
                            ? 'bg-slate-700 text-amber-300'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {st === 'all' ? 'All' : st}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="TrxID বা নাম খুঁজুন..."
                      className="bg-slate-900 border border-gray-800 focus:border-amber-400 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none w-44"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[260px]">
              {activeSection === 'deposits' && (
                <>
                  {filteredDeposits.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-gray-800 text-xs text-gray-400">
                      এই ফিল্টারে কোনো ডিপোজিট রিকোয়েস্ট নেই।
                    </div>
                  ) : (
                    filteredDeposits.map((dep) => (
                      <div
                        key={dep.id}
                        className="p-3.5 rounded-2xl bg-slate-900/80 border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[11px] text-gray-400">
                              {dep.requestCode}
                            </span>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                dep.status === 'pending'
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                                  : dep.status === 'approved'
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                                  : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                              }`}
                            >
                              {dep.status}
                            </span>
                            <span className="text-[11px] font-bold uppercase text-sky-300 bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 rounded-md">
                              {dep.method}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {formatTime(dep.createdAt)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                            <span className="font-bold text-white">
                              {dep.username}{' '}
                              <span className="text-gray-400 font-normal font-mono text-[11px]">
                                ({dep.userEmail})
                              </span>
                            </span>
                            {dep.senderNumber && (
                              <span className="text-gray-400 font-mono text-[11px]">
                                নম্বর: {dep.senderNumber}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 pt-0.5">
                            <span className="font-mono font-black text-base text-emerald-400 tabular-nums">
                              ৳ {Number(dep.amount).toLocaleString('en-US')}
                            </span>
                            <span className="font-mono text-xs text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2.5 py-0.5 rounded-lg">
                              TrxID: {dep.trxId}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {dep.status === 'pending' ? (
                            <>
                              <button
                                type="button"
                                disabled={processingId === dep.id}
                                onClick={() => handleApprove(dep)}
                                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/20"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>{processingId === dep.id ? 'প্রসেস হচ্ছে...' : 'Approve'}</span>
                              </button>
                              <button
                                type="button"
                                disabled={processingId === dep.id}
                                onClick={() => handleReject(dep)}
                                className="px-3 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          ) : (
                            <div className="text-right text-[11px] text-gray-400">
                              {dep.reviewedBy && <div>দ্বারা: {dep.reviewedBy}</div>}
                              {dep.reviewedAt && <div>{formatTime(dep.reviewedAt)}</div>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {activeSection === 'users' && (
                <div className="space-y-2">
                  {usersList.map((u) => (
                    <div
                      key={u.id}
                      className="p-3 rounded-2xl bg-slate-900/80 border border-gray-800 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white truncate">{u.username}</span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                              u.role === 'admin'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 text-gray-300 border-gray-700'
                            }`}
                          >
                            {u.role}
                          </span>
                          <span className="text-[11px] text-amber-400">
                            {u.vipTier} ({u.vipPoints} pts)
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 font-mono truncate">{u.email}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-gray-400">বর্তমান ব্যালেন্স</div>
                        <div className="font-mono font-black text-base text-emerald-400 tabular-nums">
                          ৳ {Number(u.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'logs' && (
                <div className="space-y-2">
                  {auditLogs.length === 0 ? (
                    <div className="text-center py-10 text-xs text-gray-500">এখনও কোনো অডিট লগ নেই।</div>
                  ) : (
                    auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-2xl bg-slate-900/80 border border-gray-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                                log.action === 'DEPOSIT_APPROVED'
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                                  : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                              }`}
                            >
                              {log.action}
                            </span>
                            <span className="text-gray-400 font-mono">{log.adminEmail}</span>
                          </div>
                          <p className="text-gray-200 truncate">{log.details}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-amber-400">
                            ৳{Number(log.amount).toLocaleString('en-US')}
                          </div>
                          <div className="text-[10px] text-gray-400">{formatTime(log.createdAt)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
