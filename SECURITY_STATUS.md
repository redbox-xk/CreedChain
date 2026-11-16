# CreedChain security status

## Status: fail-closed prototype hardening

This change set deliberately disables value-moving and key-generating operations. It does **not** make CreedChain a production-ready cryptocurrency or establish a secure mainnet.

## Changes in this branch

- Signature generation no longer returns random bytes pretending to be a signature.
- Signature verification now rejects every signature instead of accepting every signature.
- Mnemonic generation and HD derivation are disabled. The previous routines were not BIP39/BIP32 implementations.
- Address generation is disabled. The previous implementation derived the address hash from private-key bytes and returned the private key as the public key.
- Public transaction validation rejects transactions until there is a real ownership-proof and script-validation implementation.
- Wallet API responses omit mnemonic phrases and private keys and send `Cache-Control: no-store`.
- Wallet creation, address derivation, transaction broadcasting and mining HTTP endpoints return HTTP 503 while the required cryptographic and consensus components are unavailable.
- Direct node calls for transaction creation and mining also fail closed.
- Network statistics no longer claim that the node has peers or is synchronized; this implementation has no peer transport.
- Recent transaction limits are clamped to 1–100.

## Critical existing-data warning

The current database schema stores wallet mnemonics and address private keys as plaintext. Older API behavior also returned the complete wallet object. Assume any wallet created before this hardening may have exposed secrets. Do not use those wallets to hold real funds. Move any real assets to a newly generated wallet created by a separately audited wallet implementation. Do not publish, log, or send old mnemonic phrases/private keys to anyone.

This branch does not attempt an unsafe in-place encryption migration because there is no established key-management system, KMS integration, or authenticated user/session ownership model. Adding ad-hoc encryption with a hard-coded key would create a false sense of security.

## Required before re-enabling transactions or mining

1. Use a maintained, audited secp256k1 library with standard private/public key encodings and deterministic ECDSA or Schnorr as explicitly selected by the protocol.
2. Implement BIP39 using the complete official wordlist, entropy/checksum validation and PBKDF2-HMAC-SHA512; implement BIP32 derivation and a documented address/script format.
3. Define canonical transaction serialization and transaction IDs. Sign the complete, domain-separated transaction sighash, not only an input outpoint.
4. Carry sufficient public-key/script data to verify ownership. Validate every signature, address, amount, integer range, duplicate input, output sum, fee and coinbase rule.
5. Keep pending spends in a reservation/mempool overlay. Never delete confirmed UTXOs or create spendable change before a block is accepted.
6. Validate every candidate block before changing chain, UTXO or database state. Enforce previous hash, height, timestamp rules, Merkle root, proof of work, difficulty adjustment, coinbase maturity and reward limits.
7. Implement peer discovery, authenticated message framing, chain selection, reorg handling and synchronization before reporting a network as online.
8. Add authentication, per-wallet authorization, rate limits, CSRF protections where cookie sessions are used, secure secret storage, backups and key rotation.
9. Add unit, property-based, adversarial and integration tests; run dependency, static-analysis and security scans. Verify clean database migrations and recovery from interrupted writes.
10. Obtain independent cryptographic and protocol review before handling real funds.

## Important limitation

The disabled legacy mining and spending implementations remain in the source inside commented blocks for review; they are not reachable through the public node methods in this branch. Remove them in the next cleanup after a replacement implementation and tests exist. Do not treat a successful TypeScript build as protocol or cryptographic validation.
