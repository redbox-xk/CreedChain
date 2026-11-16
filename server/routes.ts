import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { blockchainNode } from "./blockchain/node";
import { createWalletRequestSchema, sendTransactionRequestSchema, mineBlockRequestSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Network Stats
  app.get("/api/stats", (req, res) => {
    try {
      const stats = blockchainNode.getNetworkStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get network stats" });
    }
  });

  // Blocks
  app.get("/api/blocks", (req, res) => {
    try {
      const blocks = blockchainNode.getChain();
      res.json(blocks);
    } catch (error) {
      res.status(500).json({ error: "Failed to get blocks" });
    }
  });

  app.get("/api/blocks/mined", (req, res) => {
    try {
      const blocks = blockchainNode.getMinedBlocks();
      res.json(blocks);
    } catch (error) {
      res.status(500).json({ error: "Failed to get mined blocks" });
    }
  });

  app.get("/api/block/:hash", (req, res) => {
    try {
      const { hash } = req.params;
      
      // Try to parse as number first (block height)
      const height = parseInt(hash, 10);
      let block;
      
      if (!isNaN(height)) {
        block = blockchainNode.getBlock(height);
      } else {
        block = blockchainNode.getBlock(hash);
      }
      
      if (!block) {
        return res.status(404).json({ error: "Block not found" });
      }
      
      // Add confirmations
      const latestBlock = blockchainNode.getLatestBlock();
      block = {
        ...block,
        confirmations: latestBlock.height - block.height + 1,
      };
      
      res.json(block);
    } catch (error) {
      res.status(500).json({ error: "Failed to get block" });
    }
  });

  // Transactions
  app.get("/api/transactions", (req, res) => {
    try {
      const transactions = blockchainNode.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });

  app.get("/api/transactions/recent", (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const transactions = blockchainNode.getRecentTransactions(limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get recent transactions" });
    }
  });

  app.get("/api/transaction/:txid", (req, res) => {
    try {
      const { txid } = req.params;
      const transaction = blockchainNode.getTransaction(txid);
      
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to get transaction" });
    }
  });

  app.post("/api/transaction/send", (_req, res) => {
    // No transaction may be broadcast while signature verification is unavailable.
    return res.status(503).json({
      error: "Transaction broadcasting is temporarily disabled pending audited signature verification",
      code: "CRYPTO_UNAVAILABLE",
    });
  });

  // Mempool
  app.get("/api/mempool", (req, res) => {
    try {
      const mempool = blockchainNode.getMempool();
      res.json(mempool);
    } catch (error) {
      res.status(500).json({ error: "Failed to get mempool" });
    }
  });

  // Wallet
  app.get("/api/wallet", (_req, res) => {
    try {
      const wallet = blockchainNode.getFirstWallet();
      if (!wallet) return res.status(404).json({ error: "No wallet found" });

      // Never serialize mnemonic phrases or private keys through an API.
      res.setHeader("Cache-Control", "no-store");
      res.json({
        id: wallet.id,
        name: wallet.name,
        createdAt: wallet.createdAt,
        addresses: wallet.addresses.map(({ address, publicKey, path, label, balance }) => ({
          address, publicKey, path, label, balance,
        })),
      });
    } catch {
      res.status(500).json({ error: "Failed to get wallet" });
    }
  });

  app.post("/api/wallet", (_req, res) => {
    return res.status(503).json({
      error: "Wallet creation is disabled until audited BIP39/BIP32 key management is implemented",
      code: "WALLET_CRYPTO_UNAVAILABLE",
    });
  });

  app.post("/api/wallet/address", (_req, res) => {
    return res.status(503).json({
      error: "Address derivation is disabled until audited HD wallet support is implemented",
      code: "WALLET_CRYPTO_UNAVAILABLE",
    });
  });

  app.get("/api/wallet/transactions", (req, res) => {
    try {
      const wallet = blockchainNode.getFirstWallet();
      
      if (!wallet) {
        return res.status(404).json({ error: "No wallet found" });
      }
      
      const transactions = blockchainNode.getWalletTransactions(wallet.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get wallet transactions" });
    }
  });

  // Mining
  app.get("/api/mining/stats", (req, res) => {
    try {
      const stats = blockchainNode.getMiningStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to get mining stats" });
    }
  });

  app.post("/api/mining/start", (_req, res) => {
    return res.status(503).json({
      error: "Mining is disabled until block and transaction consensus validation is enforced",
      code: "CONSENSUS_UNAVAILABLE",
    });
  });

  app.post("/api/mining/stop", (req, res) => {
    try {
      blockchainNode.stopMining();
      res.json({ success: true, message: "Mining stopped" });
    } catch (error) {
      res.status(500).json({ error: "Failed to stop mining" });
    }
  });

  // Search
  app.get("/api/search", (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.json([]);
      }
      
      const results = blockchainNode.search(query);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  return httpServer;
}
