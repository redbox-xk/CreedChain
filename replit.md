# CREEDchain - Bitcoin-like Blockchain Platform

## Overview

CREEDchain is a Bitcoin-like blockchain platform featuring Proof-of-Work mining, UTXO transaction model, HD wallet system, and a comprehensive blockchain explorer. The application provides real-time blockchain network monitoring, wallet management, transaction tracking, and mining capabilities through a modern web interface.

The platform implements core Bitcoin protocol concepts including:
- Proof-of-Work consensus mechanism with adjustable difficulty
- UTXO (Unspent Transaction Output) transaction model
- HD wallet support with BIP32/BIP39 standards
- Block mining and rewards with halving
- Real-time network statistics and blockchain exploration
- Transaction mempool management

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching

**UI Component System**
- Shadcn/ui components built on Radix UI primitives
- Tailwind CSS for styling with custom design system
- Theme system supporting light/dark modes with CSS variables
- Design inspired by blockchain explorers (Etherscan) and fintech dashboards (Stripe, Coinbase)

**Typography & Styling**
- Primary font: Inter for body text and UI elements
- Monospace font: JetBrains Mono for technical data (addresses, hashes, transaction IDs)
- Custom color system with HSL values for precise theming
- Responsive grid system with mobile-first approach

**State Management**
- React Query for API data caching with infinite stale time (blockchain data is immutable)
- Local component state for UI interactions
- No global state management library required

### Backend Architecture

**Server Framework**
- Express.js REST API server
- HTTP server for handling both API requests and static file serving
- Development mode uses Vite middleware for HMR
- Production mode serves pre-built static assets

**Blockchain Node Implementation**
- In-memory blockchain node (`BlockchainNode` class)
- Manages chain state, mempool, and UTXO set
- Implements Proof-of-Work mining with adjustable difficulty
- Block validation and transaction verification
- Mining rewards and halving mechanism

**Transaction Model**
- UTXO-based transaction system similar to Bitcoin
- Transaction inputs reference previous outputs
- Script-based locking/unlocking mechanism
- Coinbase transactions for mining rewards
- Transaction fee calculation

**Wallet System**
- HD wallet generation with mnemonic phrases
- Address derivation using BIP32 standards
- Private/public key cryptography using secp256k1 curve
- Balance tracking through UTXO aggregation

**Cryptographic Operations**
- SHA-256 and double SHA-256 hashing
- RIPEMD-160 for address generation
- ECDSA signatures for transaction verification
- Base58 encoding for addresses

**API Design**
- RESTful endpoints for blockchain operations
- Real-time mining statistics with polling
- Search functionality across blocks, transactions, and addresses
- Wallet management and transaction creation endpoints

### Data Storage Solutions

**In-Memory Storage**
- Blockchain stored as array of blocks in memory
- UTXO set maintained as Map for O(1) lookups
- Mempool for pending transactions
- Wallet data stored in Map by wallet ID
- No persistent database required (demo/development focused)

**Database Configuration Present**
- Drizzle ORM configured with PostgreSQL support
- Schema defined but not actively used in current implementation
- Database can be added later for persistence without code changes
- Migration system ready via drizzle-kit

### External Dependencies

**Core Blockchain Libraries**
- Node.js crypto module for cryptographic operations
- No external blockchain libraries - custom implementation

**UI Libraries**
- @radix-ui/* - Accessible UI primitive components
- @tanstack/react-query - Server state management
- wouter - Lightweight routing
- react-hook-form - Form state management
- zod - Schema validation and type safety

**Styling & Design**
- tailwindcss - Utility-first CSS framework
- class-variance-authority - Component variant management
- clsx & tailwind-merge - Class name utilities
- lucide-react - Icon library
- date-fns - Date formatting utilities

**Development Tools**
- TypeScript for static typing
- Vite with plugins for development experience
- ESBuild for production bundling
- tsx for TypeScript execution in Node.js

**Session & Storage**
- express-session configured for user sessions
- connect-pg-simple for PostgreSQL session store (when database is active)
- memorystore as fallback for in-memory sessions

**Build & Deployment**
- Custom build script using ESBuild for server bundling
- Dependency bundling for faster cold starts
- Vite for client-side asset optimization
- Production server serves from dist directory