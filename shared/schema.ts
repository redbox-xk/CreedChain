import { z } from "zod";

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

// Legacy user schema for compatibility
export const users = {
  id: "",
  username: "",
  password: "",
};

export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = { id: string; username: string; password: string };
