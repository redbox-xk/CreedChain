import { z } from "zod";
import { pgTable, text, integer, bigint, boolean, jsonb, timestamp, serial, varchar, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// ============================================================================
// BLOCKCHAIN CONSTANTS
// ============================================================================

export const BLOCKCHAIN_CONSTANTS = {
  INITIAL_DIFFICULTY: 4,
  BLOCK_REWARD: 50,
  HALVING_INTERVAL: 210000,
  TARGET_BLOCK_TIME: 10000, // 10 seconds for demo (normally 10 minutes)
  MAX_TRANSACTIONS_PER_BLOCK: 100,
  MIN_TRANSACTION_FEE: 0.0001,
  COINBASE_MATURITY: 6,
  GENESIS_TIMESTAMP: Date.now(),
};

// ============================================================================
// TRANSACTION TYPES (UTXO Model)
// ============================================================================

export const txInputSchema = z.object({
  txid: z.string(),
  vout: z.number(),
  scriptSig: z.string(),
  sequence: z.number().default(0xffffffff),
});

export const txOutputSchema = z.object({
  value: z.number(), // in satoshis
  scriptPubKey: z.string(),
  address: z.string(),
});

export const transactionSchema = z.object({
  txid: z.string(),
  version: z.number().default(1),
  inputs: z.array(txInputSchema),
  outputs: z.array(txOutputSchema),
  locktime: z.number().default(0),
  timestamp: z.number(),
  fee: z.number().default(0),
  confirmations: z.number().default(0),
  blockHash: z.string().optional(),
  blockHeight: z.number().optional(),
});

export type TxInput = z.infer<typeof txInputSchema>;
export type TxOutput = z.infer<typeof txOutputSchema>;
export type Transaction = z.infer<typeof transactionSchema>;

// ============================================================================
// BLOCK TYPES
// ============================================================================

export const blockHeaderSchema = z.object({
  version: z.number().default(1),
  prevHash: z.string(),
  merkleRoot: z.string(),
  timestamp: z.number(),
  difficulty: z.number(),
  nonce: z.number(),
});

export const blockSchema = z.object({
  hash: z.string(),
  header: blockHeaderSchema,
  height: z.number(),
  transactions: z.array(transactionSchema),
  size: z.number(),
  weight: z.number(),
  confirmations: z.number().default(0),
});

export type BlockHeader = z.infer<typeof blockHeaderSchema>;
export type Block = z.infer<typeof blockSchema>;

// ============================================================================
// WALLET TYPES (HD Wallet - BIP32/BIP39)
// ============================================================================

export const addressSchema = z.object({
  address: z.string(),
  publicKey: z.string(),
  privateKey: z.string(),
  path: z.string(),
  label: z.string().optional(),
  balance: z.number().default(0),
});

export const walletSchema = z.object({
  id: z.string(),
  name: z.string(),
  mnemonic: z.string(),
  addresses: z.array(addressSchema),
  createdAt: z.number(),
});

export type Address = z.infer<typeof addressSchema>;
export type Wallet = z.infer<typeof walletSchema>;

// ============================================================================
// UTXO (Unspent Transaction Output)
// ============================================================================

export const utxoSchema = z.object({
  txid: z.string(),
  vout: z.number(),
  address: z.string(),
  value: z.number(),
  scriptPubKey: z.string(),
  confirmations: z.number(),
  spendable: z.boolean().default(true),
});

export type UTXO = z.infer<typeof utxoSchema>;

// ============================================================================
// NETWORK & MINING STATS
// ============================================================================

export const networkStatsSchema = z.object({
  blockHeight: z.number(),
  difficulty: z.number(),
  hashrate: z.number(),
  totalTransactions: z.number(),
  mempoolSize: z.number(),
  totalSupply: z.number(),
  circulatingSupply: z.number(),
  blockReward: z.number(),
  avgBlockTime: z.number(),
  peers: z.number(),
  syncStatus: z.enum(["synced", "syncing", "offline"]),
});

export const miningStatsSchema = z.object({
  isActive: z.boolean(),
  hashrate: z.number(),
  blocksFound: z.number(),
  totalRewards: z.number(),
  currentNonce: z.number(),
  difficulty: z.number(),
  targetHash: z.string(),
  startTime: z.number().optional(),
});

export type NetworkStats = z.infer<typeof networkStatsSchema>;
export type MiningStats = z.infer<typeof miningStatsSchema>;

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export const createWalletRequestSchema = z.object({
  name: z.string().min(1).max(50),
});

export const sendTransactionRequestSchema = z.object({
  fromAddress: z.string(),
  toAddress: z.string(),
  amount: z.number().positive(),
  fee: z.number().min(0).default(0.0001),
});

export const mineBlockRequestSchema = z.object({
  minerAddress: z.string(),
});

export type CreateWalletRequest = z.infer<typeof createWalletRequestSchema>;
export type SendTransactionRequest = z.infer<typeof sendTransactionRequestSchema>;
export type MineBlockRequest = z.infer<typeof mineBlockRequestSchema>;

// ============================================================================
// SEARCH TYPES
// ============================================================================

export const searchResultSchema = z.object({
  type: z.enum(["block", "transaction", "address"]),
  id: z.string(),
  preview: z.string(),
});

export type SearchResult = z.infer<typeof searchResultSchema>;

// ============================================================================
// DATABASE TABLES (Drizzle ORM)
// ============================================================================

// Blocks table
export const blocksTable = pgTable("blocks", {
  id: serial("id").primaryKey(),
  hash: varchar("hash", { length: 64 }).notNull().unique(),
  height: integer("height").notNull().unique(),
  version: integer("version").notNull().default(1),
  prevHash: varchar("prev_hash", { length: 64 }).notNull(),
  merkleRoot: varchar("merkle_root", { length: 64 }).notNull(),
  blockTimestamp: bigint("block_timestamp", { mode: "number" }).notNull(),
  difficulty: integer("difficulty").notNull(),
  nonce: bigint("nonce", { mode: "number" }).notNull(),
  size: integer("size").notNull(),
  weight: integer("weight").notNull(),
  transactionCount: integer("transaction_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBlockSchema = createInsertSchema(blocksTable).omit({ id: true, createdAt: true });
export type InsertBlock = z.infer<typeof insertBlockSchema>;
export type DbBlock = typeof blocksTable.$inferSelect;

// Transactions table
export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  txid: varchar("txid", { length: 64 }).notNull().unique(),
  version: integer("version").notNull().default(1),
  locktime: integer("locktime").notNull().default(0),
  txTimestamp: bigint("tx_timestamp", { mode: "number" }).notNull(),
  fee: bigint("fee", { mode: "number" }).notNull().default(0),
  blockHash: varchar("block_hash", { length: 64 }),
  blockHeight: integer("block_height"),
  inputs: jsonb("inputs").notNull().$type<TxInput[]>(),
  outputs: jsonb("outputs").notNull().$type<TxOutput[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type DbTransaction = typeof transactionsTable.$inferSelect;

// UTXOs table
export const utxosTable = pgTable("utxos", {
  id: serial("id").primaryKey(),
  txid: varchar("txid", { length: 64 }).notNull(),
  vout: integer("vout").notNull(),
  address: varchar("address", { length: 64 }).notNull(),
  value: bigint("value", { mode: "number" }).notNull(),
  scriptPubKey: text("script_pub_key").notNull(),
  confirmations: integer("confirmations").notNull().default(0),
  spendable: boolean("spendable").notNull().default(true),
  spent: boolean("spent").notNull().default(false),
  spentTxid: varchar("spent_txid", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUtxoSchema = createInsertSchema(utxosTable).omit({ id: true, createdAt: true });
export type InsertUtxo = z.infer<typeof insertUtxoSchema>;
export type DbUtxo = typeof utxosTable.$inferSelect;

// Wallets table
export const walletsTable = pgTable("wallets", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  mnemonic: text("mnemonic").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const insertWalletSchema = createInsertSchema(walletsTable);
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type DbWallet = typeof walletsTable.$inferSelect;

// Wallet addresses table
export const addressesTable = pgTable("addresses", {
  id: serial("id").primaryKey(),
  walletId: varchar("wallet_id", { length: 64 }).notNull(),
  address: varchar("address", { length: 64 }).notNull().unique(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  path: varchar("path", { length: 50 }).notNull(),
  label: varchar("label", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAddressSchema = createInsertSchema(addressesTable).omit({ id: true, createdAt: true });
export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type DbAddress = typeof addressesTable.$inferSelect;

// Mempool table (for pending transactions)
export const mempoolTable = pgTable("mempool", {
  id: serial("id").primaryKey(),
  txid: varchar("txid", { length: 64 }).notNull().unique(),
  rawTx: jsonb("raw_tx").notNull().$type<Transaction>(),
  fee: bigint("fee", { mode: "number" }).notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

export const insertMempoolSchema = createInsertSchema(mempoolTable).omit({ id: true, addedAt: true });
export type InsertMempool = z.infer<typeof insertMempoolSchema>;
export type DbMempool = typeof mempoolTable.$inferSelect;

// Legacy user schema for compatibility
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
