import { BlockchainCrypto } from "./crypto";
import type { Transaction, TxInput, TxOutput, UTXO } from "@shared/schema";

export class TransactionBuilder {
  static createCoinbase(
    minerAddress: string,
    blockHeight: number,
    blockReward: number
  ): Transaction {
    const coinbaseInput: TxInput = {
      txid: "0".repeat(64),
      vout: 0,
      scriptSig: `coinbase-${blockHeight}`,
      sequence: 0xffffffff,
    };

    const coinbaseOutput: TxOutput = {
      value: blockReward,
      scriptPubKey: `OP_DUP OP_HASH160 ${minerAddress} OP_EQUALVERIFY OP_CHECKSIG`,
      address: minerAddress,
    };

    const tx: Transaction = {
      txid: "",
      version: 1,
      inputs: [coinbaseInput],
      outputs: [coinbaseOutput],
      locktime: 0,
      timestamp: Date.now(),
      fee: 0,
      confirmations: 0,
    };

    tx.txid = this.calculateTxId(tx);
    return tx;
  }

  static createTransaction(
    inputs: { utxo: UTXO; privateKey: string }[],
    outputs: { address: string; value: number }[],
    fee: number
  ): Transaction {
    const txInputs: TxInput[] = inputs.map((input) => ({
      txid: input.utxo.txid,
      vout: input.utxo.vout,
      scriptSig: BlockchainCrypto.signMessage(
        input.privateKey,
        `${input.utxo.txid}:${input.utxo.vout}`
      ),
      sequence: 0xffffffff,
    }));

    const txOutputs: TxOutput[] = outputs.map((output) => ({
      value: output.value,
      scriptPubKey: `OP_DUP OP_HASH160 ${output.address} OP_EQUALVERIFY OP_CHECKSIG`,
      address: output.address,
    }));

    const tx: Transaction = {
      txid: "",
      version: 1,
      inputs: txInputs,
      outputs: txOutputs,
      locktime: 0,
      timestamp: Date.now(),
      fee,
      confirmations: 0,
    };

    tx.txid = this.calculateTxId(tx);
    return tx;
  }

  static calculateTxId(tx: Omit<Transaction, "txid">): string {
    const data = JSON.stringify({
      version: tx.version,
      inputs: tx.inputs,
      outputs: tx.outputs,
      locktime: tx.locktime,
      timestamp: tx.timestamp,
    });
    return BlockchainCrypto.doubleSha256(data);
  }

  static validateTransaction(tx: Transaction, utxoSet: Map<string, UTXO>): boolean {
    if (tx.inputs.length === 0 || tx.outputs.length === 0) {
      return false;
    }

    if (tx.inputs.length === 1 && tx.inputs[0].txid === "0".repeat(64)) {
      return true;
    }

    let inputSum = 0;
    for (const input of tx.inputs) {
      const utxoKey = `${input.txid}:${input.vout}`;
      const utxo = utxoSet.get(utxoKey);
      if (!utxo) {
        return false;
      }
      inputSum += utxo.value;
    }

    const outputSum = tx.outputs.reduce((sum, out) => sum + out.value, 0);
    
    if (outputSum > inputSum) {
      return false;
    }

    return true;
  }
}
