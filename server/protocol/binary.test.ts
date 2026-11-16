import test from "node:test";
import assert from "node:assert/strict";
import { BinaryProtocolError, BinaryReader, BinaryWriter } from "./binary";
test("round-trips fixed-width integers and canonical varuint", () => {
  const encoded = new BinaryWriter().u8(255).u16(65535).u32(0xffff_ffff).u64(0xffff_ffff_ffff_ffffn).varUint(300n).finish();
  const r = new BinaryReader(encoded);
  assert.equal(r.u8(), 255); assert.equal(r.u16(), 65535); assert.equal(r.u32(), 0xffff_ffff);
  assert.equal(r.u64(), 0xffff_ffff_ffff_ffffn); assert.equal(r.varUint(), 300n); r.assertFinished();
});
test("round-trips fixed and variable byte strings", () => {
  const source = Buffer.from([0, 1, 127, 128, 255]);
  const r = new BinaryReader(new BinaryWriter().fixed(source, 5).bytes(source).finish());
  assert.deepEqual(r.fixed(5), source); assert.deepEqual(r.bytes(), source); r.assertFinished();
});
test("rejects overlong varuint and trailing bytes", () => {
  assert.throws(() => new BinaryReader(Buffer.from([0x80, 0x00])).varUint(), BinaryProtocolError);
  const r = new BinaryReader(Buffer.from([1, 2])); r.u8(); assert.throws(() => r.assertFinished(), BinaryProtocolError);
});
test("rejects truncated fields and out-of-range values", () => {
  assert.throws(() => new BinaryReader(Buffer.from([1])).u32(), BinaryProtocolError);
  assert.throws(() => new BinaryWriter().u8(256), BinaryProtocolError);
  assert.throws(() => new BinaryWriter().u64(-1n), BinaryProtocolError);
});