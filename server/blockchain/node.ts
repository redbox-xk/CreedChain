import { BlockBuilder } from "./block";
import { TransactionBuilder } from "./transaction";
import { BlockchainCrypto, generateMnemonic, deriveAddressFromPath } from "./crypto";
import type { Block, Transaction, UTXO, Wallet, Address, NetworkStats, MiningStats } from "@shared/schema";
import { BLOCKCHAIN_CONSTANTS } from "@shared/schema";
import { blockchainDb } from "./db-storage";

export class BlockchainNode {
  private chain: Block[] = [];
  private mempool: Transaction[] = [];
  private utxoSet: Map<string, UTXO> = new Map();
  private wallets: Map<string, Wallet> = new Map();
  private miningActive: boolean = false;
  private miningStats: MiningStats = {
    isActive: false,
    hashrate: 0,
    blocksFound: 0,
    totalRewards: 0,
    currentNonce: 0,
    difficulty: BLOCKCHAIN_CONSTANTS.INITIAL_DIFFICULTY,
    targetHash: BlockBuilder.getTarget(BLOCKCHAIN_CONSTANTS.INITIAL_DIFFICULTY),
  };
  private miningInterval: NodeJS.Timeout | null = null;
  private minerAddress: string | null = null;
  private initialized: boolean = false;

  constructor() {
    this.initializeChain();
  }

  private async initializeChain(): Promise<void> {
    try {
      const dbBlocks = await blockchainDb.getBlocks(1000);
      if (dbBlocks.length > 0) {
        this.chain = dbBlocks.reverse();
        const mempoolTxs = await blockchainDb.getMempoolTxs();
        this.mempool = mempoolTxs;
        for (const block of this.chain) {
          for (const tx of block.transactions) {
            for (let i = 0; i < tx.outputs.length; i++) {
              const output = tx.outputs[i];
              const utxo: UTXO = {
                txid: tx.txid,
                vout: i,
                address: output.address,
                value: output.value,
                scriptPubKey: output.scriptPubKey,
                confirmations: this.chain.length - (block.height || 0),
                spendable: true,
              };
              this.utxoSet.set(`${tx.txid}:${i}`, utxo);
            }
          }
        }
        for (const block of this.chain) {
          for (const tx of block.transactions) {
            for (const input of tx.inputs) {
              if (input.txid !== "0".repeat(64)) {
                this.utxoSet.delete(`${input.txid}:${input.vout}`);
              }
            }
          }
        }
        const dbWallet = await blockchainDb.getFirstWallet();
        if (dbWallet) {
          this.wallets.set(dbWallet.id, dbWallet);
        }
      } else {
        const genesis = BlockBuilder.createGenesisBlock();
        this.chain.push(genesis);
        await blockchainDb.saveBlock(genesis);
      }
      this.initialized = true;
    } catch (error) {
      console.log("Database not available, using in-memory storage");
      const genesis = BlockBuilder.createGenesisBlock();
      this.chain.push(genesis);
      this.initialized = true;
    }
  }

  getChain(): Block[] {
    return [...this.chain].reverse();
  }

  getBlock(hashOrHeight: string | number): Block | undefined {
    if (typeof hashOrHeight === "number") {
      return this.chain.find((b) => b.height === hashOrHeight);
    }
    return this.chain.find((b) => b.hash === hashOrHeight);
  }

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  getTransaction(txid: string): Transaction | undefined {
    for (const block of this.chain) {
      const tx = block.transactions.find((t) => t.txid === txid);
      if (tx) {
        return {
          ...tx,
          blockHash: block.hash,
          blockHeight: block.height,
          confirmations: this.chain.length - block.height,
        };
      }
    }
    return this.mempool.find((t) => t.txid === txid);
  }

  getAllTransactions(): Transaction[] {
    const txs: Transaction[] = [];
    for (const block of [...this.chain].reverse()) {
      for (const tx of block.transactions) {
        txs.push({
          ...tx,
          blockHash: block.hash,
          blockHeight: block.height,
          confirmations: this.chain.length - block.height,
        });
      }
    }
    return txs;
  }

  getRecentTransactions(limit: number = 10): Transaction[] {
    return this.getAllTransactions().slice(0, limit);
  }

  getMempool(): Transaction[] {
    return [...this.mempool];
  }

  addTransaction(tx: Transaction): boolean {
    if (!TransactionBuilder.validateTransaction(tx, this.utxoSet)) {
      return false;
    }
    this.mempool.push(tx);
    return true;
  }

  getNetworkStats(): NetworkStats {
    const totalTx = this.chain.reduce((sum, b) => sum + b.transactions.length, 0);
    const latestBlock = this.getLatestBlock();
    
    let totalSupply = 0;
    for (const block of this.chain) {
      if (block.height > 0) {
        totalSupply += this.getBlockReward(block.height);
      }
    }

    const avgBlockTime = this.chain.length > 1
      ? (latestBlock.header.timestamp - this.chain[0].header.timestamp) / this.chain.length
      : BLOCKCHAIN_CONSTANTS.TARGET_BLOCK_TIME;

    return {
      blockHeight: latestBlock.height,
      difficulty: latestBlock.header.difficulty,
      hashrate: this.miningStats.hashrate,
      totalTransactions: totalTx,
      mempoolSize: this.mempool.length,
      totalSupply,
      circulatingSupply: totalSupply,
      blockReward: this.getBlockReward(latestBlock.height + 1),
      avgBlockTime,
      peers: 1,
      syncStatus: "synced",
    };
  }

  getBlockReward(height: number): number {
    const halvings = Math.floor(height / BLOCKCHAIN_CONSTANTS.HALVING_INTERVAL);
    let reward = BLOCKCHAIN_CONSTANTS.BLOCK_REWARD * 100000000;
    for (let i = 0; i < halvings; i++) {
      reward = Math.floor(reward / 2);
    }
    return reward;
  }

  createWallet(name: string): Wallet {
    const mnemonic = generateMnemonic(12);
    const firstAddress = deriveAddressFromPath(mnemonic, "m/44'/0'/0'/0/0");
    
    const wallet: Wallet = {
      id: BlockchainCrypto.generateRandomBytes(16),
      name,
      mnemonic,
      addresses: [
        {
          ...firstAddress,
          label: "Default",
          balance: 0,
        },
      ],
      createdAt: Date.now(),
    };

    this.wallets.set(wallet.id, wallet);
    blockchainDb.saveWallet(wallet).catch(console.error);
    return wallet;
  }

  getWallet(id: string): Wallet | undefined {
    return this.wallets.get(id);
  }

  getFirstWallet(): Wallet | undefined {
    const wallets = Array.from(this.wallets.values());
    return wallets[0];
  }

  addAddressToWallet(walletId: string): Address | undefined {
    const wallet = this.wallets.get(walletId);
    if (!wallet) return undefined;

    const index = wallet.addresses.length;
    const path = `m/44'/0'/0'/0/${index}`;
    const newAddress = deriveAddressFromPath(wallet.mnemonic, path);
    
    const address: Address = {
      ...newAddress,
      label: `Address ${index + 1}`,
      balance: 0,
    };

    wallet.addresses.push(address);
    return address;
  }

  getAddressBalance(address: string): number {
    let balance = 0;
    for (const [, utxo] of this.utxoSet) {
      if (utxo.address === address && utxo.spendable) {
        balance += utxo.value;
      }
    }
    return balance;
  }

  getAddressUTXOs(address: string): UTXO[] {
    const utxos: UTXO[] = [];
    for (const [, utxo] of this.utxoSet) {
      if (utxo.address === address && utxo.spendable) {
        utxos.push(utxo);
      }
    }
    return utxos;
  }

  updateWalletBalances(): void {
    for (const wallet of this.wallets.values()) {
      let walletModified = false;
      for (const address of wallet.addresses) {
        const newBalance = this.getAddressBalance(address.address);
        if (address.balance !== newBalance) {
          address.balance = newBalance;
          walletModified = true;
        }
      }
      if (walletModified) {
        blockchainDb.saveWallet(wallet).catch(console.error);
      }
    }
  }

  getWalletTransactions(walletId: string): Transaction[] {
    const wallet = this.wallets.get(walletId);
    if (!wallet) return [];

    const addresses = new Set(wallet.addresses.map((a) => a.address));
    const txs: Transaction[] = [];

    for (const block of this.chain) {
      for (const tx of block.transactions) {
        const isRelevant =
          tx.outputs.some((o) => addresses.has(o.address)) ||
          tx.inputs.some((i) => {
            const utxo = this.utxoSet.get(`${i.txid}:${i.vout}`);
            return utxo && addresses.has(utxo.address);
          });

        if (isRelevant) {
          txs.push({
            ...tx,
            blockHash: block.hash,
            blockHeight: block.height,
            confirmations: this.chain.length - block.height,
          });
        }
      }
    }

    return txs.reverse();
  }

  sendTransaction(
    fromAddress: string,
    toAddress: string,
    amount: number,
    fee: number
  ): Transaction | null {
    let wallet: Wallet | undefined;
    let senderKey: string | undefined;

    for (const w of this.wallets.values()) {
      const addr = w.addresses.find((a) => a.address === fromAddress);
      if (addr) {
        wallet = w;
        senderKey = addr.privateKey;
        break;
      }
    }

    if (!wallet || !senderKey) {
      throw new Error("Sender address not found in any wallet");
    }

    const utxos = this.getAddressUTXOs(fromAddress);
    const totalNeeded = amount + fee;

    let selectedValue = 0;
    const selectedUtxos: { utxo: UTXO; privateKey: string }[] = [];

    for (const utxo of utxos) {
      selectedUtxos.push({ utxo, privateKey: senderKey });
      selectedValue += utxo.value;
      if (selectedValue >= totalNeeded) break;
    }

    if (selectedValue < totalNeeded) {
      throw new Error("Insufficient funds");
    }

    const outputs: { address: string; value: number }[] = [
      { address: toAddress, value: amount },
    ];

    const change = selectedValue - totalNeeded;
    if (change > 0) {
      outputs.push({ address: fromAddress, value: change });
    }

    const tx = TransactionBuilder.createTransaction(selectedUtxos, outputs, fee);

    for (const input of selectedUtxos) {
      const key = `${input.utxo.txid}:${input.utxo.vout}`;
      this.utxoSet.delete(key);
    }

    for (let i = 0; i < tx.outputs.length; i++) {
      const output = tx.outputs[i];
      const utxo: UTXO = {
        txid: tx.txid,
        vout: i,
        address: output.address,
        value: output.value,
        scriptPubKey: output.scriptPubKey,
        confirmations: 0,
        spendable: true,
      };
      this.utxoSet.set(`${tx.txid}:${i}`, utxo);
    }

    this.mempool.push(tx);
    blockchainDb.addMempoolTx(tx).catch(console.error);
    this.updateWalletBalances();

    return tx;
  }

  getMiningStats(): MiningStats {
    return { ...this.miningStats };
  }

  startMining(minerAddress: string): void {
    if (this.miningActive) return;

    this.minerAddress = minerAddress;
    this.miningActive = true;
    this.miningStats.isActive = true;
    this.miningStats.startTime = Date.now();

    this.mineNextBlock();
  }

  private async mineNextBlock(): Promise<void> {
    if (!this.miningActive || !this.minerAddress) return;

    const prevBlock = this.getLatestBlock();
    const blockReward = this.getBlockReward(prevBlock.height + 1);
    
    const coinbase = TransactionBuilder.createCoinbase(
      this.minerAddress,
      prevBlock.height + 1,
      blockReward
    );

    const transactions = [coinbase, ...this.mempool.slice(0, 99)];
    
    const newBlock = BlockBuilder.createBlock(
      prevBlock,
      transactions,
      BLOCKCHAIN_CONSTANTS.INITIAL_DIFFICULTY
    );

    let nonce = 0;
    const mineChunk = () => {
      if (!this.miningActive) return;

      const startTime = Date.now();
      const iterationsPerChunk = 10000;

      for (let i = 0; i < iterationsPerChunk; i++) {
        newBlock.header.nonce = nonce;
        const hash = BlockBuilder.calculateBlockHash(newBlock.header);

        if (BlockBuilder.checkProofOfWork(hash, newBlock.header.difficulty)) {
          newBlock.hash = hash;
          this.addMinedBlock(newBlock);
          
          this.miningStats.blocksFound++;
          this.miningStats.totalRewards += blockReward;
          
          if (this.miningActive) {
            setTimeout(() => this.mineNextBlock(), 100);
          }
          return;
        }

        nonce++;
        this.miningStats.currentNonce = nonce;
      }

      const elapsed = Date.now() - startTime;
      this.miningStats.hashrate = Math.floor((iterationsPerChunk / elapsed) * 1000);

      if (this.miningActive) {
        setImmediate(mineChunk);
      }
    };

    mineChunk();
  }

  private addMinedBlock(block: Block): void {
    // 1. Process UTXOs for all transactions in the block
    for (const tx of block.transactions) {
      // Spend inputs
      for (const input of tx.inputs) {
        if (input.txid !== "0".repeat(64)) {
          this.utxoSet.delete(`${input.txid}:${input.vout}`);
          blockchainDb.spendUtxo(input.txid, input.vout, tx.txid).catch(console.error);
        }
      }

      // Create new outputs
      for (let i = 0; i < tx.outputs.length; i++) {
        const output = tx.outputs[i];
        const utxo: UTXO = {
          txid: tx.txid,
          vout: i,
          address: output.address,
          value: output.value,
          scriptPubKey: output.scriptPubKey,
          confirmations: 1,
          spendable: true,
        };
        this.utxoSet.set(`${tx.txid}:${i}`, utxo);
      }
    }

    // 2. Remove confirmed transactions from mempool
    // Skip coinbase (first transaction) as it's not in mempool
    for (const tx of block.transactions.slice(1)) {
      const index = this.mempool.findIndex((t) => t.txid === tx.txid);
      if (index !== -1) {
        this.mempool.splice(index, 1);
        blockchainDb.removeMempoolTx(tx.txid).catch(console.error);
      }
    }

    // 3. Increment confirmations for all UTXOs in the set
    for (const utxo of this.utxoSet.values()) {
      utxo.confirmations++;
    }

    // 4. Update chain and persist
    this.chain.push(block);
    blockchainDb.saveBlock(block).catch(console.error);

    // 5. Update wallet balances and persist changes
    this.updateWalletBalances();
  }

  stopMining(): void {
    this.miningActive = false;
    this.miningStats.isActive = false;
    this.miningStats.hashrate = 0;
    this.miningStats.startTime = undefined;
  }

  search(query: string): Array<{ type: "block" | "transaction" | "address"; id: string; preview: string }> {
    const results: Array<{ type: "block" | "transaction" | "address"; id: string; preview: string }> = [];

    const heightNum = parseInt(query, 10);
    if (!isNaN(heightNum)) {
      const block = this.getBlock(heightNum);
      if (block) {
        results.push({
          type: "block",
          id: block.hash,
          preview: `Block #${block.height} - ${block.transactions.length} transactions`,
        });
      }
    }

    for (const block of this.chain) {
      if (block.hash.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          type: "block",
          id: block.hash,
          preview: `Block #${block.height} - ${block.transactions.length} transactions`,
        });
      }
    }

    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.txid.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            type: "transaction",
            id: tx.txid,
            preview: `Transaction in block #${block.height}`,
          });
        }
      }
    }

    for (const wallet of this.wallets.values()) {
      for (const address of wallet.addresses) {
        if (address.address.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            type: "address",
            id: address.address,
            preview: `Balance: ${address.balance / 100000000} CREED`,
          });
        }
      }
    }

    return results.slice(0, 20);
  }

  getMinedBlocks(): Block[] {
    if (!this.minerAddress) return [];
    
    return this.chain.filter((block) => {
      if (block.transactions.length === 0) return false;
      const coinbase = block.transactions[0];
      return coinbase.outputs.some((o) => o.address === this.minerAddress);
    }).reverse();
  }
}

export const blockchainNode = new BlockchainNode();
