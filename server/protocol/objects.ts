import { Buffer } from "node:buffer";
import { BlockchainCrypto } from "../blockchain/crypto";
import { BinaryProtocolError, BinaryReader, BinaryWriter, CBP_LIMITS } from "./binary";

const HEX_32 = /^[0-9a-f]{64}$/i;
const MAX_ITEMS = CBP_LIMITS.maxCollectionItems;

export interface CBPInput {
  txid: string;
  vout: number;
  sequence: number;
  unlockingData: Buffer;
}
export interface CBPOutput {
  amount: bigint;
  lockingData: Buffer;
}
export interface CBPTransaction {
  version: number;
  networkId: number;
  timestamp: bigint;
  locktime: bigint;
  inputs: CBPInput[];
  outputs: CBPOutput[];
  fee: bigint;
}
export interface CBPBlockHeader {
  version: number;
  networkId: number;
  height: bigint;
  previousBlockId: string;
  transactionRoot: string;
  stateRoot: string;
  timestamp: bigint;
  consensusData: Buffer;
  nonce: bigint;
}
export interface CBPBlock {
  header: CBPBlockHeader;
  transactions: CBPTransaction[];
}

function assertCount(count: number, label: string): void {
  if (!Number.isSafeInteger(count) || count < 0 || count > MAX_ITEMS) {
    throw new BinaryProtocolError(`${label} count exceeds protocol limits`);
  }
}
function assertHex32(value: string, label: string): Buffer {
  if (!HEX_32.test(value)) throw new BinaryProtocolError(`${label} must be exactly 32 bytes of hex`);
  return Buffer.from(value, "hex");
}
function readCount(reader: BinaryReader, label: string): number {
  const n = reader.varUint();
  if (n > BigInt(MAX_ITEMS)) throw new BinaryProtocolError(`${label} count exceeds protocol limits`);
  return Number(n);
}
function encodeTransactionBody(tx: CBPTransaction): Buffer {
  assertCount(tx.inputs.length, "Input");
  assertCount(tx.outputs.length, "Output");
  const w = new BinaryWriter()
    .u16(tx.version).u32(tx.networkId).u64(tx.timestamp).u64(tx.locktime)
    .varUint(BigInt(tx.inputs.length));
  for (const input of tx.inputs) {
    w.fixed(assertHex32(input.txid, "Input txid"), 32)
      .u32(input.vout).u32(input.sequence).bytes(input.unlockingData);
  }
  w.varUint(BigInt(tx.outputs.length));
  for (const output of tx.outputs) {
    if (output.amount < 0n || output.amount > 0xffff_ffff_ffff_ffffn) {
      throw new BinaryProtocolError("Output amount is outside u64 range");
    }
    w.u64(output.amount).bytes(output.lockingData);
  }
  return w.u64(tx.fee).finish();
}

/** Canonical CBP v1 transaction body. No JSON or object-key ordering is involved. */
export function encodeTransaction(tx: CBPTransaction): Buffer {
  return encodeTransactionBody(tx);
}
export function decodeTransaction(bytes: Buffer): CBPTransaction {
  const r = new BinaryReader(bytes);
  const version = r.u16(), networkId = r.u32(), timestamp = r.u64(), locktime = r.u64();
  const inputs: CBPInput[] = [];
  for (let i = 0, n = readCount(r, "Input"); i < n; i++) {
    inputs.push({ txid: r.fixed(32).toString("hex"), vout: r.u32(), sequence: r.u32(), unlockingData: r.bytes() });
  }
  const outputs: CBPOutput[] = [];
  for (let i = 0, n = readCount(r, "Output"); i < n; i++) {
    outputs.push({ amount: r.u64(), lockingData: r.bytes() });
  }
  const fee = r.u64();
  r.assertFinished();
  return { version, networkId, timestamp, locktime, inputs, outputs, fee };
}
export function transactionId(tx: CBPTransaction): string {
  return BlockchainCrypto.doubleSha256(Buffer.concat([Buffer.from("CREEDCHAIN/TX/V1\0", "ascii"), encodeTransaction(tx)]));
}

function encodeHeader(header: CBPBlockHeader): Buffer {
  return new BinaryWriter()
    .u16(header.version).u32(header.networkId).u64(header.height)
    .fixed(assertHex32(header.previousBlockId, "Previous block ID"), 32)
    .fixed(assertHex32(header.transactionRoot, "Transaction root"), 32)
    .fixed(assertHex32(header.stateRoot, "State root"), 32)
    .u64(header.timestamp).bytes(header.consensusData).u64(header.nonce).finish();
}
function decodeHeader(bytes: Buffer): CBPBlockHeader {
  const r = new BinaryReader(bytes);
  const header: CBPBlockHeader = {
    version: r.u16(), networkId: r.u32(), height: r.u64(),
    previousBlockId: r.fixed(32).toString("hex"),
    transactionRoot: r.fixed(32).toString("hex"),
    stateRoot: r.fixed(32).toString("hex"),
    timestamp: r.u64(), consensusData: r.bytes(), nonce: r.u64(),
  };
  r.assertFinished();
  return header;
}
export function encodeBlock(block: CBPBlock): Buffer {
  assertCount(block.transactions.length, "Transaction");
  const header = encodeHeader(block.header);
  const w = new BinaryWriter().bytes(header).varUint(BigInt(block.transactions.length));
  for (const tx of block.transactions) w.bytes(encodeTransaction(tx));
  return w.finish();
}
export function decodeBlock(bytes: Buffer): CBPBlock {
  const r = new BinaryReader(bytes);
  const header = decodeHeader(r.bytes());
  const transactions: CBPTransaction[] = [];
  for (let i = 0, n = readCount(r, "Transaction"); i < n; i++) {
    transactions.push(decodeTransaction(r.bytes()));
  }
  r.assertFinished();
  return { header, transactions };
}
export function blockId(block: CBPBlock): string {
  return BlockchainCrypto.doubleSha256(Buffer.concat([Buffer.from("CREEDCHAIN/BLOCK/V1\0", "ascii"), encodeHeader(block.header)]));
}
