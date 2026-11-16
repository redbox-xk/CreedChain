import test from "node:test";
import assert from "node:assert/strict";
import { BinaryProtocolError } from "./binary";
import { blockId, decodeBlock, decodeTransaction, encodeBlock, encodeTransaction, transactionId, type CBPBlock, type CBPTransaction } from "./objects";

const tx: CBPTransaction = {
  version: 1, networkId: 7, timestamp: 1_700_000_000n, locktime: 0n, fee: 25n,
  inputs: [{ txid: "11".repeat(32), vout: 2, sequence: 0xffff_ffff, unlockingData: Buffer.from([0xaa, 0xbb]) }],
  outputs: [{ amount: 900n, lockingData: Buffer.from([0x51]) }, { amount: 75n, lockingData: Buffer.from([0x00, 0x14, 0x22]) }],
};
const block: CBPBlock = {
  header: {
    version: 1, networkId: 7, height: 42n,
    previousBlockId: "22".repeat(32), transactionRoot: "33".repeat(32), stateRoot: "44".repeat(32),
    timestamp: 1_700_000_010n, consensusData: Buffer.from([1, 2, 3]), nonce: 99n,
  },
  transactions: [tx],
};

test("transaction encoding round-trips and is byte-canonical", () => {
  const bytes = encodeTransaction(tx);
  assert.deepEqual(encodeTransaction(decodeTransaction(bytes)), bytes);
  assert.equal(transactionId(tx).length, 64);
  assert.equal(transactionId(tx), transactionId(decodeTransaction(bytes)));
});
test("block encoding round-trips and has a stable header identifier", () => {
  const bytes = encodeBlock(block);
  const decoded = decodeBlock(bytes);
  assert.deepEqual(encodeBlock(decoded), bytes);
  assert.equal(blockId(block), blockId(decoded));
});
test("transaction IDs commit to witness/unlocking data", () => {
  const changed = { ...tx, inputs: [{ ...tx.inputs[0], unlockingData: Buffer.from([0xcc]) }] };
  assert.notEqual(transactionId(tx), transactionId(changed));
});
test("rejects malformed identifiers and trailing bytes", () => {
  assert.throws(() => encodeTransaction({ ...tx, inputs: [{ ...tx.inputs[0], txid: "abcd" }] }), BinaryProtocolError);
  assert.throws(() => decodeTransaction(Buffer.concat([encodeTransaction(tx), Buffer.from([0])])), BinaryProtocolError);
});
