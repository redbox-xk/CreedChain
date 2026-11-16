import crypto from "crypto";

export class BlockchainCrypto {
  static sha256(data: string | Buffer): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  static doubleSha256(data: string | Buffer): string {
    const first = crypto.createHash("sha256").update(data).digest();
    return crypto.createHash("sha256").update(first).digest("hex");
  }

  static hash160(data: Buffer): Buffer {
    const sha256 = crypto.createHash("sha256").update(data).digest();
    return crypto.createHash("ripemd160").update(sha256).digest();
  }

  static generateKeyPair(): { privateKey: string; publicKey: string } {
    const keyPair = crypto.generateKeyPairSync("ec", {
      namedCurve: "secp256k1",
    });

    const privateKey = keyPair.privateKey
      .export({ type: "sec1", format: "der" })
      .toString("hex");
    const publicKey = keyPair.publicKey
      .export({ type: "spki", format: "der" })
      .toString("hex");

    return { privateKey, publicKey };
  }

  static generateRandomBytes(length: number): string {
    return crypto.randomBytes(length).toString("hex");
  }

  static base58Encode(buffer: Buffer): string {
    const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let num = BigInt("0x" + buffer.toString("hex"));
    let encoded = "";

    while (num > 0n) {
      const remainder = num % 58n;
      num = num / 58n;
      encoded = alphabet[Number(remainder)] + encoded;
    }

    for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
      encoded = "1" + encoded;
    }

    return encoded;
  }

  static base58CheckEncode(payload: Buffer, version: number): string {
    const versionedPayload = Buffer.concat([Buffer.from([version]), payload]);
    const checksum = Buffer.from(
      this.doubleSha256(versionedPayload).slice(0, 8),
      "hex"
    );
    const fullPayload = Buffer.concat([versionedPayload, checksum]);
    return this.base58Encode(fullPayload);
  }

  /**
   * Disabled until key generation, address derivation and signing use one
   * audited, interoperable secp256k1 implementation. The former implementation
   * derived addresses from private-key bytes and did not derive a public key.
   */
  static generateAddress(): { address: string; privateKey: string; publicKey: string } {
    throw new Error("Wallet generation is disabled: cryptographic implementation is not production-safe");
  }

  static signMessage(_privateKey: string, _message: string): string {
    throw new Error("Transaction signing is disabled until audited secp256k1 signing is implemented");
  }

  static verifySignature(_publicKey: string, _message: string, _signature: string): boolean {
    // Fail closed. Never accept an unverified transaction signature.
    return false;
  }
}

export function generateMnemonic(_wordCount: number = 12): string {
  throw new Error("Mnemonic generation is disabled: this implementation is not BIP39-compliant");
}

export function deriveAddressFromPath(_mnemonic: string, _path: string): {
  address: string;
  privateKey: string;
  publicKey: string;
  path: string;
} {
  throw new Error("HD wallet derivation is disabled: this implementation is not BIP32/BIP39-compliant");
}
