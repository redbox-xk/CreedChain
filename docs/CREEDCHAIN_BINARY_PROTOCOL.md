# CreedChain Binary Protocol (CBP) — initial specification

## Design objective
CreedChain is being redesigned around a canonical binary protocol. Binary is authoritative for transactions, blocks, state commitments and peer messages. JSON may be used by explorer/API presentation only; it must never determine consensus identifiers or validity.

## Security boundary
CBP is deterministic serialization, not a new cryptographic primitive. Hashing, signatures, key derivation and authenticated transport must use established, reviewed standards and implementations. Do not invent home-grown signature, hash, encryption or key-exchange algorithms.

## v1 primitive rules
- Fixed-width integers are unsigned and little-endian.
- u8/u16/u32/u64 have widths of 1/2/4/8 bytes.
- Variable unsigned integers use canonical unsigned LEB128, limited to u64. Overlong encodings are invalid.
- Variable byte strings are canonical varuint length followed by raw bytes.
- Maximum frame size: 1 MiB; maximum variable byte field: 256 KiB.
- Parsers reject truncation, out-of-range values, non-canonical encodings and trailing bytes.
- Collections must be length-prefixed and bounded.
- Consensus amounts are integer atomic units; floating-point values are forbidden.
- No locale-dependent strings, implicit object ordering, JSON serialization or native struct layout may enter consensus encoding.

## Proposed network envelope (not activated)
| Field | Width | Rule |
|---|---:|---|
| Magic | 4 bytes | bytes spelling CRD1 |
| Protocol version | u16 | little-endian |
| Message type | u16 | assigned registry; unknown types rejected |
| Payload length | u32 | little-endian; bounded |
| Payload | declared length | canonical message-specific bytes |

The envelope is a proposal only. Networking must wait for peer authentication, replay handling, message limits, version negotiation and fuzz tests.

## Planned canonical objects
### Transaction
Version (u16), network ID (u32), input count (varuint), ordered inputs, output count (varuint), ordered outputs, locktime (u64), and separately specified witness data. Inputs reference a 32-byte transaction ID and u32 output index. Outputs carry an integer u64 amount and a length-prefixed script/program byte string. Transaction IDs hash canonical non-witness bytes with an established domain-separated hash.

### Block
Version (u16), network ID (u32), height (u64), previous block ID (32 bytes), transaction commitment (32 bytes), state commitment (32 bytes), timestamp (u64), consensus payload length and bytes, then bounded transactions. Consensus payload and commitment rules must be finalized before activation.

## Implemented object codec subset (still not consensus-active)

`server/protocol/objects.ts` now defines explicit typed CBP objects and canonical encoders/decoders for transactions and blocks:
- Transaction body: version u16, network ID u32, timestamp u64, locktime u64, bounded input count, ordered inputs (32-byte txid, output index u32, sequence u32, length-prefixed unlocking data), bounded output count, ordered outputs (amount u64, length-prefixed locking program), fee u64.
- Block: length-prefixed canonical header, bounded transaction count, then length-prefixed canonical transaction bodies.
- Header: version u16, network ID u32, height u64, previous block ID (32 bytes), transaction root (32 bytes), state root (32 bytes), timestamp u64, length-prefixed consensus data, nonce u64.
- `transactionId()` hashes a domain-separated non-witness transaction preimage with double-SHA-256. Unlocking data is excluded from the txid preimage; the full transaction encoding still transports it.
- `blockId()` hashes the domain-separated canonical header bytes. It does not validate proof-of-work or consensus.
- Decoders reject trailing bytes, truncation, invalid fixed-size hashes, oversized collections and invalid field ranges through the primitive codec.

The object codecs are deterministic serialization only. They are not wired into the legacy database, mempool, wallet, miner, or P2P service. They do not verify signatures, scripts, transaction economics, Merkle roots, state roots, proof-of-work, fork choice, or block validity. A successful encode/decode round trip is not evidence that a transaction or block is valid.

## Current implementation status
server/protocol/binary.ts implements safe binary primitives only. It is not connected to the legacy chain, wallet, mining or database. Existing value-moving operations remain fail-closed.

## Activation gates
1. Publish a versioned byte-for-byte specification and test vectors.
2. Add canonical transaction and block encoders/decoders.
3. Define network ID, genesis constants, supply schedule, script/ownership model and consensus/fork-choice rules.
4. Use established cryptographic libraries and publish independent test vectors.
5. Implement deterministic state transitions and atomic persistence/reorg recovery.
6. Implement peer protocol, authentication, replay protection, synchronization and DoS limits.
7. Run cross-implementation tests, fuzzing, property tests, adversarial tests and independent review.
8. Only then consider a public testnet. Never re-enable real-fund functionality solely because the build succeeds.

## Non-goals
- Do not store binary data as text strings of 0s and 1s; actual bytes are the correct representation.
- No custom cryptographic primitive.
- No quantum-resistance or production-security claim without a separately specified and audited design.