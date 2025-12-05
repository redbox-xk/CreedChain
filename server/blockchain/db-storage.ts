import { db } from "../db";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  blocksTable,
  transactionsTable,
  utxosTable,
  walletsTable,
  addressesTable,
  mempoolTable,
  type Block,
  type Transaction,
  type UTXO,
  type Wallet,
  type Address,
  type TxInput,
  type TxOutput,
} from "@shared/schema";

export class BlockchainDbStorage {
  async saveBlock(block: Block): Promise<void> {
    await db.insert(blocksTable).values({
      hash: block.hash,
      height: block.height,
      version: block.header.version,
      prevHash: block.header.prevHash,
      merkleRoot: block.header.merkleRoot,
      blockTimestamp: block.header.timestamp,
      difficulty: block.header.difficulty,
      nonce: block.header.nonce,
      size: block.size,
      weight: block.weight,
      transactionCount: block.transactions.length,
    }).onConflictDoNothing();

    for (const tx of block.transactions) {
      await this.saveTransaction(tx, block.hash, block.height);
    }
  }

  async saveTransaction(tx: Transaction, blockHash?: string, blockHeight?: number): Promise<void> {
    await db.insert(transactionsTable).values({
      txid: tx.txid,
      version: tx.version,
      locktime: tx.locktime,
      txTimestamp: tx.timestamp,
      fee: tx.fee,
      blockHash: blockHash || tx.blockHash,
      blockHeight: blockHeight || tx.blockHeight,
      inputs: tx.inputs,
      outputs: tx.outputs,
    }).onConflictDoUpdate({
      target: transactionsTable.txid,
      set: {
        blockHash: blockHash || tx.blockHash,
        blockHeight: blockHeight || tx.blockHeight,
      }
    });

    for (let i = 0; i < tx.outputs.length; i++) {
      const output = tx.outputs[i];
      await this.saveUtxo({
        txid: tx.txid,
        vout: i,
        address: output.address,
        value: output.value,
        scriptPubKey: output.scriptPubKey,
        confirmations: 0,
        spendable: true,
      });
    }
  }

  async saveUtxo(utxo: UTXO): Promise<void> {
    await db.insert(utxosTable).values({
      txid: utxo.txid,
      vout: utxo.vout,
      address: utxo.address,
      value: utxo.value,
      scriptPubKey: utxo.scriptPubKey,
      confirmations: utxo.confirmations,
      spendable: utxo.spendable,
      spent: false,
    }).onConflictDoNothing();
  }

  async spendUtxo(txid: string, vout: number, spentTxid: string): Promise<void> {
    await db.update(utxosTable)
      .set({ spent: true, spendable: false, spentTxid })
      .where(and(eq(utxosTable.txid, txid), eq(utxosTable.vout, vout)));
  }

  async getBlocks(limit = 50): Promise<Block[]> {
    const dbBlocks = await db.select()
      .from(blocksTable)
      .orderBy(desc(blocksTable.height))
      .limit(limit);

    const blocks: Block[] = [];
    for (const dbBlock of dbBlocks) {
      const txs = await this.getBlockTransactions(dbBlock.hash);
      blocks.push(this.dbBlockToBlock(dbBlock, txs));
    }
    return blocks;
  }

  async getBlockByHash(hash: string): Promise<Block | undefined> {
    const [dbBlock] = await db.select()
      .from(blocksTable)
      .where(eq(blocksTable.hash, hash))
      .limit(1);

    if (!dbBlock) return undefined;
    const txs = await this.getBlockTransactions(hash);
    return this.dbBlockToBlock(dbBlock, txs);
  }

  async getBlockByHeight(height: number): Promise<Block | undefined> {
    const [dbBlock] = await db.select()
      .from(blocksTable)
      .where(eq(blocksTable.height, height))
      .limit(1);

    if (!dbBlock) return undefined;
    const txs = await this.getBlockTransactions(dbBlock.hash);
    return this.dbBlockToBlock(dbBlock, txs);
  }

  async getLatestBlock(): Promise<Block | undefined> {
    const [dbBlock] = await db.select()
      .from(blocksTable)
      .orderBy(desc(blocksTable.height))
      .limit(1);

    if (!dbBlock) return undefined;
    const txs = await this.getBlockTransactions(dbBlock.hash);
    return this.dbBlockToBlock(dbBlock, txs);
  }

  async getBlockHeight(): Promise<number> {
    const [result] = await db.select({ maxHeight: sql<number>`COALESCE(MAX(${blocksTable.height}), -1)` })
      .from(blocksTable);
    return result?.maxHeight ?? -1;
  }

  private async getBlockTransactions(blockHash: string): Promise<Transaction[]> {
    const dbTxs = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.blockHash, blockHash));

    return dbTxs.map(tx => this.dbTxToTransaction(tx));
  }

  async getTransaction(txid: string): Promise<Transaction | undefined> {
    const [dbTx] = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.txid, txid))
      .limit(1);

    if (!dbTx) return undefined;
    return this.dbTxToTransaction(dbTx);
  }

  async getRecentTransactions(limit = 20): Promise<Transaction[]> {
    const dbTxs = await db.select()
      .from(transactionsTable)
      .orderBy(desc(transactionsTable.txTimestamp))
      .limit(limit);

    return dbTxs.map(tx => this.dbTxToTransaction(tx));
  }

  async getTotalTransactions(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`COUNT(*)` })
      .from(transactionsTable);
    return result?.count ?? 0;
  }

  async getUtxosForAddress(address: string): Promise<UTXO[]> {
    const dbUtxos = await db.select()
      .from(utxosTable)
      .where(and(eq(utxosTable.address, address), eq(utxosTable.spent, false)));

    return dbUtxos.map(u => ({
      txid: u.txid,
      vout: u.vout,
      address: u.address,
      value: u.value,
      scriptPubKey: u.scriptPubKey,
      confirmations: u.confirmations,
      spendable: u.spendable,
    }));
  }

  async getAddressBalance(address: string): Promise<number> {
    const [result] = await db.select({ total: sql<number>`COALESCE(SUM(${utxosTable.value}), 0)` })
      .from(utxosTable)
      .where(and(eq(utxosTable.address, address), eq(utxosTable.spent, false)));
    return result?.total ?? 0;
  }

  async getAddressTransactions(address: string): Promise<Transaction[]> {
    const dbTxs = await db.select()
      .from(transactionsTable)
      .orderBy(desc(transactionsTable.txTimestamp));

    const relevantTxs = dbTxs.filter(tx => {
      const inputs = tx.inputs as TxInput[];
      const outputs = tx.outputs as TxOutput[];
      return outputs.some(o => o.address === address) ||
             inputs.some(i => i.scriptSig.includes(address));
    });

    return relevantTxs.map(tx => this.dbTxToTransaction(tx));
  }

  async saveWallet(wallet: Wallet): Promise<void> {
    await db.insert(walletsTable).values({
      id: wallet.id,
      name: wallet.name,
      mnemonic: wallet.mnemonic,
      createdAt: wallet.createdAt,
    }).onConflictDoNothing();

    for (const addr of wallet.addresses) {
      await db.insert(addressesTable).values({
        walletId: wallet.id,
        address: addr.address,
        publicKey: addr.publicKey,
        privateKey: addr.privateKey,
        path: addr.path,
        label: addr.label,
      }).onConflictDoNothing();
    }
  }

  async getWallet(id: string): Promise<Wallet | undefined> {
    const [dbWallet] = await db.select()
      .from(walletsTable)
      .where(eq(walletsTable.id, id))
      .limit(1);

    if (!dbWallet) return undefined;

    const dbAddresses = await db.select()
      .from(addressesTable)
      .where(eq(addressesTable.walletId, id));

    const addresses: Address[] = [];
    for (const dbAddr of dbAddresses) {
      const balance = await this.getAddressBalance(dbAddr.address);
      addresses.push({
        address: dbAddr.address,
        publicKey: dbAddr.publicKey,
        privateKey: dbAddr.privateKey,
        path: dbAddr.path,
        label: dbAddr.label || undefined,
        balance,
      });
    }

    return {
      id: dbWallet.id,
      name: dbWallet.name,
      mnemonic: dbWallet.mnemonic,
      addresses,
      createdAt: dbWallet.createdAt,
    };
  }

  async getFirstWallet(): Promise<Wallet | undefined> {
    const [dbWallet] = await db.select()
      .from(walletsTable)
      .limit(1);

    if (!dbWallet) return undefined;
    return this.getWallet(dbWallet.id);
  }

  async addMempoolTx(tx: Transaction): Promise<void> {
    await db.insert(mempoolTable).values({
      txid: tx.txid,
      rawTx: tx,
      fee: tx.fee,
    }).onConflictDoNothing();
  }

  async removeMempoolTx(txid: string): Promise<void> {
    await db.delete(mempoolTable)
      .where(eq(mempoolTable.txid, txid));
  }

  async getMempoolTxs(): Promise<Transaction[]> {
    const dbTxs = await db.select()
      .from(mempoolTable)
      .orderBy(desc(mempoolTable.fee));

    return dbTxs.map(m => m.rawTx as Transaction);
  }

  async getMempoolSize(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`COUNT(*)` })
      .from(mempoolTable);
    return result?.count ?? 0;
  }

  async updateConfirmations(currentHeight: number): Promise<void> {
    await db.execute(sql`
      UPDATE ${utxosTable}
      SET confirmations = ${currentHeight} - COALESCE(
        (SELECT block_height FROM ${transactionsTable} WHERE ${transactionsTable.txid} = ${utxosTable.txid}),
        ${currentHeight}
      ) + 1
      WHERE spent = false
    `);
  }

  async getTotalSupply(): Promise<number> {
    const [result] = await db.select({ total: sql<number>`COALESCE(SUM(${utxosTable.value}), 0)` })
      .from(utxosTable)
      .where(eq(utxosTable.spent, false));
    return result?.total ?? 0;
  }

  private dbBlockToBlock(dbBlock: any, transactions: Transaction[]): Block {
    return {
      hash: dbBlock.hash,
      header: {
        version: dbBlock.version,
        prevHash: dbBlock.prevHash,
        merkleRoot: dbBlock.merkleRoot,
        timestamp: dbBlock.blockTimestamp,
        difficulty: dbBlock.difficulty,
        nonce: dbBlock.nonce,
      },
      height: dbBlock.height,
      transactions,
      size: dbBlock.size,
      weight: dbBlock.weight,
      confirmations: 0,
    };
  }

  private dbTxToTransaction(dbTx: any): Transaction {
    return {
      txid: dbTx.txid,
      version: dbTx.version,
      inputs: dbTx.inputs as TxInput[],
      outputs: dbTx.outputs as TxOutput[],
      locktime: dbTx.locktime,
      timestamp: dbTx.txTimestamp,
      fee: dbTx.fee,
      confirmations: 0,
      blockHash: dbTx.blockHash || undefined,
      blockHeight: dbTx.blockHeight || undefined,
    };
  }
}

export const blockchainDb = new BlockchainDbStorage();
