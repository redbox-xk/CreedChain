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

  app.post("/api/transaction/send", (req, res) => {
    try {
      const validated = sendTransactionRequestSchema.safeParse(req.body);
      
      if (!validated.success) {
        return res.status(400).json({ error: validated.error.errors[0].message });
      }
      
      const { fromAddress, toAddress, amount, fee } = validated.data;
      
      // Convert amount to satoshis if needed
      const amountSatoshis = Math.floor(amount * 100000000);
      const feeSatoshis = Math.floor((fee || 0.0001) * 100000000);
      
      const transaction = blockchainNode.sendTransaction(
        fromAddress,
        toAddress,
        amountSatoshis,
        feeSatoshis
      );
      
      if (!transaction) {
        return res.status(400).json({ error: "Failed to create transaction" });
      }
      
      res.json(transaction);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to send transaction" });
    }
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
  app.get("/api/wallet", (req, res) => {
    try {
      const wallet = blockchainNode.getFirstWallet();
      
      if (!wallet) {
        return res.status(404).json({ error: "No wallet found" });
      }
      
      res.json(wallet);
    } catch (error) {
      res.status(500).json({ error: "Failed to get wallet" });
    }
  });

  app.post("/api/wallet", (req, res) => {
    try {
      const validated = createWalletRequestSchema.safeParse(req.body);
      
      if (!validated.success) {
        return res.status(400).json({ error: validated.error.errors[0].message });
      }
      
      const { name } = validated.data;
      const wallet = blockchainNode.createWallet(name);
      res.json(wallet);
    } catch (error) {
      res.status(500).json({ error: "Failed to create wallet" });
    }
  });

  app.post("/api/wallet/address", (req, res) => {
    try {
      const wallet = blockchainNode.getFirstWallet();
      
      if (!wallet) {
        return res.status(404).json({ error: "No wallet found" });
      }
      
      const address = blockchainNode.addAddressToWallet(wallet.id);
      
      if (!address) {
        return res.status(500).json({ error: "Failed to create address" });
      }
      
      res.json(address);
    } catch (error) {
      res.status(500).json({ error: "Failed to create address" });
    }
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

  app.post("/api/mining/start", (req, res) => {
    try {
      const validated = mineBlockRequestSchema.safeParse(req.body);
      
      if (!validated.success) {
        return res.status(400).json({ error: validated.error.errors[0].message });
      }
      
      const { minerAddress } = validated.data;
      blockchainNode.startMining(minerAddress);
      res.json({ success: true, message: "Mining started" });
    } catch (error) {
      res.status(500).json({ error: "Failed to start mining" });
    }
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
