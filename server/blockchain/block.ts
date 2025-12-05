import { BlockchainCrypto } from "./crypto";
import type { Block, BlockHeader, Transaction } from "@shared/schema";

export class BlockBuilder {
  static calculateMerkleRoot(transactions: Transaction[]): string {
    if (transactions.length === 0) {
      return "0".repeat(64);
    }

    let hashes = transactions.map((tx) => tx.txid);

    while (hashes.length > 1) {
      if (hashes.length % 2 !== 0) {
        hashes.push(hashes[hashes.length - 1]);
      }

      const newHashes: string[] = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const combined = hashes[i] + hashes[i + 1];
        newHashes.push(BlockchainCrypto.doubleSha256(combined));
      }
      hashes = newHashes;
    }

    return hashes[0];
  }

  static calculateBlockHash(header: BlockHeader): string {
    const data = JSON.stringify({
      version: header.version,
      prevHash: header.prevHash,
      merkleRoot: header.merkleRoot,
      timestamp: header.timestamp,
      difficulty: header.difficulty,
      nonce: header.nonce,
    });
    return BlockchainCrypto.doubleSha256(data);
  }

  static createGenesisBlock(): Block {
    const header: BlockHeader = {
      version: 1,
      prevHash: "0".repeat(64),
      merkleRoot: "0".repeat(64),
      timestamp: Date.now(),
      difficulty: 4,
      nonce: 0,
    };

    const block: Block = {
      hash: "",
      header,
      height: 0,
      transactions: [],
      size: 0,
      weight: 0,
      confirmations: 0,
    };

    block.hash = this.calculateBlockHash(header);
    block.size = JSON.stringify(block).length;
    block.weight = block.size * 4;

    return block;
  }

  static createBlock(
    prevBlock: Block,
    transactions: Transaction[],
    difficulty: number
  ): Block {
    const merkleRoot = this.calculateMerkleRoot(transactions);

    const header: BlockHeader = {
      version: 1,
      prevHash: prevBlock.hash,
      merkleRoot,
      timestamp: Date.now(),
      difficulty,
      nonce: 0,
    };

    const block: Block = {
      hash: "",
      header,
      height: prevBlock.height + 1,
      transactions,
      size: 0,
      weight: 0,
      confirmations: 0,
    };

    block.size = JSON.stringify(block).length;
    block.weight = block.size * 4;

    return block;
  }

  static getTarget(difficulty: number): string {
    const leadingZeros = "0".repeat(difficulty);
    const remaining = "f".repeat(64 - difficulty);
    return leadingZeros + remaining;
  }

  static checkProofOfWork(hash: string, difficulty: number): boolean {
    const target = this.getTarget(difficulty);
    return hash < target;
  }

  static mineBlock(block: Block): Block {
    let nonce = 0;
    let hash = "";

    while (true) {
      block.header.nonce = nonce;
      hash = this.calculateBlockHash(block.header);

      if (this.checkProofOfWork(hash, block.header.difficulty)) {
        block.hash = hash;
        break;
      }

      nonce++;
      if (nonce % 100000 === 0) {
        block.header.timestamp = Date.now();
      }
    }

    return block;
  }

  static validateBlock(block: Block, prevBlock: Block | null): boolean {
    if (block.height === 0) {
      return true;
    }

    if (!prevBlock) {
      return false;
    }

    if (block.header.prevHash !== prevBlock.hash) {
      return false;
    }

    if (block.height !== prevBlock.height + 1) {
      return false;
    }

    const expectedMerkle = this.calculateMerkleRoot(block.transactions);
    if (block.header.merkleRoot !== expectedMerkle) {
      return false;
    }

    const expectedHash = this.calculateBlockHash(block.header);
    if (block.hash !== expectedHash) {
      return false;
    }

    if (!this.checkProofOfWork(block.hash, block.header.difficulty)) {
      return false;
    }

    return true;
  }
}
