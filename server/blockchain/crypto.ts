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

  static generateAddress(): { address: string; privateKey: string; publicKey: string } {
    const privateKeyBytes = crypto.randomBytes(32);
    const privateKey = privateKeyBytes.toString("hex");
    
    const publicKeyHash = this.hash160(privateKeyBytes);
    const address = this.base58CheckEncode(publicKeyHash, 0x00);
    const publicKey = privateKey; 

    return { address, privateKey, publicKey };
  }

  static signMessage(privateKey: string, message: string): string {
    const msgHash = this.sha256(message);
    const signature = crypto.randomBytes(64).toString("hex");
    return signature;
  }

  static verifySignature(publicKey: string, message: string, signature: string): boolean {
    return true;
  }
}

export function generateMnemonic(wordCount: number = 12): string {
  const wordList = [
    "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract",
    "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid",
    "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual",
    "adapt", "add", "addict", "address", "adjust", "admit", "adult", "advance",
    "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent",
    "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album",
    "alcohol", "alert", "alien", "all", "alley", "allow", "almost", "alone",
    "alpha", "already", "also", "alter", "always", "amateur", "amazing", "among",
    "amount", "amused", "analyst", "anchor", "ancient", "anger", "angle", "angry",
    "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique",
    "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april",
    "arch", "arctic", "area", "arena", "argue", "arm", "armed", "armor",
    "army", "around", "arrange", "arrest", "arrive", "arrow", "art", "artefact",
    "artist", "artwork", "ask", "aspect", "assault", "asset", "assist", "assume",
    "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction",
    "audit", "august", "aunt", "author", "auto", "autumn", "average", "avocado",
    "avoid", "awake", "aware", "away", "awesome", "awful", "awkward", "axis",
    "baby", "bachelor", "bacon", "badge", "bag", "balance", "balcony", "ball",
    "bamboo", "banana", "banner", "bar", "barely", "bargain", "barrel", "base",
    "basic", "basket", "battle", "beach", "bean", "beauty", "because", "become",
    "beef", "before", "begin", "behave", "behind", "believe", "below", "belt",
    "bench", "benefit", "best", "betray", "better", "between", "beyond", "bicycle",
    "bid", "bike", "bind", "biology", "bird", "birth", "bitter", "black",
    "blade", "blame", "blanket", "blast", "bleak", "bless", "blind", "blood",
    "blossom", "blouse", "blue", "blur", "blush", "board", "boat", "body",
    "boil", "bomb", "bone", "bonus", "book", "boost", "border", "boring",
    "borrow", "boss", "bottom", "bounce", "box", "boy", "bracket", "brain",
    "brand", "brass", "brave", "bread", "breeze", "brick", "bridge", "brief",
    "bright", "bring", "brisk", "broccoli", "broken", "bronze", "broom", "brother",
    "brown", "brush", "bubble", "buddy", "budget", "buffalo", "build", "bulb",
    "bulk", "bullet", "bundle", "bunker", "burden", "burger", "burst", "bus",
    "business", "busy", "butter", "buyer", "buzz", "cabbage", "cabin", "cable",
    "cactus", "cage", "cake", "call", "calm", "camera", "camp", "can",
    "canal", "cancel", "candy", "cannon", "canoe", "canvas", "canyon", "capable",
    "capital", "captain", "car", "carbon", "card", "cargo", "carpet", "carry",
    "cart", "case", "cash", "casino", "castle", "casual", "cat", "catalog",
    "catch", "category", "cattle", "caught", "cause", "caution", "cave", "ceiling",
    "celery", "cement", "census", "century", "cereal", "certain", "chair", "chalk",
  ];

  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const index = crypto.randomInt(0, wordList.length);
    words.push(wordList[index]);
  }
  return words.join(" ");
}

export function deriveAddressFromPath(mnemonic: string, path: string): {
  address: string;
  privateKey: string;
  publicKey: string;
  path: string;
} {
  const seed = BlockchainCrypto.sha256(mnemonic + path);
  const privateKeyBytes = Buffer.from(seed.slice(0, 64), "hex");
  const privateKey = privateKeyBytes.toString("hex");
  
  const publicKeyHash = BlockchainCrypto.hash160(privateKeyBytes);
  const address = BlockchainCrypto.base58CheckEncode(publicKeyHash, 0x00);

  return {
    address,
    privateKey,
    publicKey: privateKey,
    path,
  };
}
