import { relations } from 'drizzle-orm';
import {
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  username: text('username').notNull(),
  role: text('role').notNull().default('user'),
  balance: doublePrecision('balance').notNull().default(0),
  bonusBalance: doublePrecision('bonus_balance').notNull().default(0),
  totalWon: doublePrecision('total_won').notNull().default(0),
  totalBet: doublePrecision('total_bet').notNull().default(0),
  vipPoints: integer('vip_points').notNull().default(0),
  vipTier: text('vip_tier').notNull().default('ব্রোঞ্জ'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const depositRequests = pgTable('deposit_requests', {
  id: serial('id').primaryKey(),
  requestCode: text('request_code').notNull().unique(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  userUid: text('user_uid').notNull(),
  userEmail: text('user_email').notNull(),
  username: text('username').notNull(),
  method: text('method').notNull().default('bkash'),
  amount: doublePrecision('amount').notNull(),
  senderNumber: text('sender_number').notNull().default(''),
  trxId: text('trx_id').notNull().unique(),
  status: text('status').notNull().default('pending'),
  reviewedBy: text('reviewed_by'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at'),
});

export const withdrawalRequests = pgTable('withdrawal_requests', {
  id: serial('id').primaryKey(),
  requestCode: text('request_code').notNull().unique(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  userUid: text('user_uid').notNull(),
  userEmail: text('user_email').notNull(),
  username: text('username').notNull(),
  method: text('method').notNull(),
  amount: doublePrecision('amount').notNull(),
  accountNumber: text('account_number').notNull(),
  status: text('status').notNull().default('pending'),
  processedBy: text('processed_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
});

export const adminAuditLogs = pgTable('admin_audit_logs', {
  id: serial('id').primaryKey(),
  adminUid: text('admin_uid').notNull(),
  adminEmail: text('admin_email').notNull(),
  action: text('action').notNull(),
  targetRequestId: integer('target_request_id').notNull(),
  targetUserUid: text('target_user_uid').notNull(),
  amount: doublePrecision('amount').notNull(),
  details: text('details').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  depositRequests: many(depositRequests),
  withdrawalRequests: many(withdrawalRequests),
}));

export const depositRequestsRelations = relations(depositRequests, ({ one }) => ({
  user: one(users, {
    fields: [depositRequests.userId],
    references: [users.id],
  }),
}));

export const withdrawalRequestsRelations = relations(withdrawalRequests, ({ one }) => ({
  user: one(users, {
    fields: [withdrawalRequests.userId],
    references: [users.id],
  }),
}));
