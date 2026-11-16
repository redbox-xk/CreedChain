import { Buffer } from "node:buffer";

/**
 * CreedChain Binary Protocol (CBP) v1 primitive codec.
 * Deterministic byte encoding only; not crypto, consensus, or network auth.
 */
export const CBP_LIMITS = Object.freeze({ maxFrameBytes: 1_048_576, maxVariableBytes: 262_144, maxCollectionItems: 10_000 });

export class BinaryProtocolError extends Error {
  constructor(message: string) { super(message); this.name = "BinaryProtocolError"; }
}

export class BinaryWriter {
  private readonly chunks: Buffer[] = [];
  private length = 0;
  private append(bytes: Buffer): this {
    this.length += bytes.length;
    if (this.length > CBP_LIMITS.maxFrameBytes) throw new BinaryProtocolError("Encoded frame exceeds protocol size limit");
    this.chunks.push(bytes); return this;
  }
  u8(value: number): this {
    if (!Number.isInteger(value) || value < 0 || value > 0xff) throw new BinaryProtocolError("u8 out of range");
    return this.append(Buffer.from([value]));
  }
  u16(value: number): this {
    if (!Number.isInteger(value) || value < 0 || value > 0xffff) throw new BinaryProtocolError("u16 out of range");
    const b = Buffer.allocUnsafe(2); b.writeUInt16LE(value); return this.append(b);
  }
  u32(value: number): this {
    if (!Number.isInteger(value) || value < 0 || value > 0xffff_ffff) throw new BinaryProtocolError("u32 out of range");
    const b = Buffer.allocUnsafe(4); b.writeUInt32LE(value); return this.append(b);
  }
  u64(value: bigint): this {
    if (value < 0n || value > 0xffff_ffff_ffff_ffffn) throw new BinaryProtocolError("u64 out of range");
    const b = Buffer.allocUnsafe(8); b.writeBigUInt64LE(value); return this.append(b);
  }
  varUint(value: bigint): this {
    if (value < 0n || value > 0xffff_ffff_ffff_ffffn) throw new BinaryProtocolError("varuint out of range");
    const out: number[] = []; let n = value;
    do { let byte = Number(n & 0x7fn); n >>= 7n; if (n !== 0n) byte |= 0x80; out.push(byte); } while (n !== 0n);
    return this.append(Buffer.from(out));
  }
  fixed(bytes: Buffer, expectedLength: number): this {
    if (!Number.isSafeInteger(expectedLength) || expectedLength < 0 || bytes.length !== expectedLength) throw new BinaryProtocolError("Fixed byte field has invalid length");
    return this.append(Buffer.from(bytes));
  }
  bytes(bytes: Buffer): this {
    if (bytes.length > CBP_LIMITS.maxVariableBytes) throw new BinaryProtocolError("Variable byte field exceeds protocol limit");
    this.varUint(BigInt(bytes.length)); return this.append(Buffer.from(bytes));
  }
  finish(): Buffer { return Buffer.concat(this.chunks, this.length); }
}

export class BinaryReader {
  private offset = 0;
  constructor(private readonly data: Buffer) { if (data.length > CBP_LIMITS.maxFrameBytes) throw new BinaryProtocolError("Input frame exceeds protocol size limit"); }
  get remaining(): number { return this.data.length - this.offset; }
  private take(length: number): Buffer {
    if (!Number.isSafeInteger(length) || length < 0 || length > this.remaining) throw new BinaryProtocolError("Truncated or invalid binary field");
    const out = this.data.subarray(this.offset, this.offset + length); this.offset += length; return out;
  }
  u8(): number { return this.take(1).readUInt8(0); }
  u16(): number { return this.take(2).readUInt16LE(0); }
  u32(): number { return this.take(4).readUInt32LE(0); }
  u64(): bigint { return this.take(8).readBigUInt64LE(0); }
  varUint(): bigint {
    let value = 0n, shift = 0n, count = 0;
    while (count < 10) {
      const byte = this.u8(); value |= BigInt(byte & 0x7f) << shift; count++;
      if ((byte & 0x80) === 0) {
        if ((count > 1 && byte === 0) || value > 0xffff_ffff_ffff_ffffn) throw new BinaryProtocolError("Non-canonical or overflowing varuint");
        return value;
      }
      shift += 7n;
    }
    throw new BinaryProtocolError("varuint is too long");
  }
  fixed(length: number): Buffer { return Buffer.from(this.take(length)); }
  bytes(): Buffer {
    const length = this.varUint();
    if (length > BigInt(CBP_LIMITS.maxVariableBytes)) throw new BinaryProtocolError("Variable byte field exceeds protocol limit");
    return this.fixed(Number(length));
  }
  assertFinished(): void { if (this.remaining !== 0) throw new BinaryProtocolError("Trailing bytes are not permitted"); }
}