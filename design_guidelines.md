# CREEDchain Blockchain Platform - Design Guidelines

## Design Approach

**Selected Approach:** Hybrid - Drawing from established blockchain explorers (Etherscan, Blockchain.com) combined with modern fintech design systems (Stripe Dashboard, Coinbase).

**Key Principles:**
- Data transparency and technical precision
- Security-first visual language
- Information hierarchy for complex data
- Real-time updates and live statistics
- Professional, trustworthy aesthetic

---

## Typography

**Font Stack:**
- Primary: `'Inter', sans-serif` (Google Fonts) - body text, data tables, forms
- Monospace: `'JetBrains Mono', monospace` - addresses, hashes, transaction IDs, technical data

**Hierarchy:**
- Page Titles: text-4xl font-bold
- Section Headers: text-2xl font-semibold
- Card Titles: text-lg font-semibold
- Data Labels: text-sm font-medium uppercase tracking-wide
- Body Text: text-base
- Technical Data (hashes/addresses): text-sm font-mono
- Metadata/Timestamps: text-xs
- Large Numbers (balances/stats): text-3xl font-bold tabular-nums

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 1, 2, 4, 6, 8, 12, 16, 24
- Tight spacing: gap-2, p-2
- Standard spacing: gap-4, p-4, p-6
- Section spacing: p-8, py-12
- Page margins: px-6, max-w-7xl mx-auto

**Grid System:**
- Dashboard stats: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Explorer content: Two-column (sidebar + main content) on desktop
- Transaction tables: Full-width with horizontal scroll on mobile

---

## Component Library

### Navigation
- **Top Header:** Fixed top navigation with logo, main menu (Explorer, Wallet, Mining, API), search bar, network status indicator
- **Wallet Sidebar:** Collapsible side navigation showing addresses, balances, quick actions

### Core Components

**Block Card:**
- Compact card showing: Block height (large), hash (truncated with copy), timestamp, transaction count, miner, size
- Click to expand full details
- Visual indicator for confirmed vs. pending blocks

**Transaction Card:**
- UTXO flow visualization: inputs on left, outputs on right, arrows showing flow
- Transaction ID at top (monospace, truncated)
- Input/output addresses as badges
- Value transfers in large, prominent numbers
- Confirmation status badge (confirmed/pending/failed)

**Wallet Dashboard:**
- Balance display: Large, prominent number at top
- Address list: Table with QR code modal on click
- Recent transactions: Scrollable list with send/receive indicators
- Action buttons: Send, Receive, New Address

**Mining Interface:**
- Real-time hashrate meter (visual gauge or line chart)
- Mining statistics cards: Blocks mined, total hashrate, difficulty, time to next block
- Start/Stop mining toggle (prominent)
- Block reward countdown/progress bar

**Data Tables:**
- Striped rows for readability
- Fixed header on scroll
- Sortable columns (block height, timestamp, value)
- Monospace for addresses/hashes
- Copy-to-clipboard icons next to technical data
- Hover states revealing full data for truncated values

### Blockchain Explorer Layout

**Homepage:**
- Hero: Network statistics dashboard (4-column grid: Blocks, Transactions/sec, Hashrate, Market Cap)
- Recent blocks: Live updating list (latest 10)
- Recent transactions: Live updating list (latest 10)
- Network status: Visual chain visualization showing last 6 blocks

**Block Detail Page:**
- Header: Block height + hash (full, with copy)
- Metadata grid: Timestamp, Miner, Size, Difficulty, Nonce, Merkle Root
- Transactions list: Expandable cards
- Previous/Next block navigation

**Transaction Detail Page:**
- Transaction ID header
- UTXO visualization diagram
- Inputs table → Outputs table with visual connectors
- Confirmation count with progress indicator
- Raw transaction data (collapsible, monospace)

**Wallet Pages:**
- Dashboard: Balance hero, address management, transaction history
- Send: Form with address input, amount, fee slider, preview before send
- Receive: QR code generator, address display with copy

### Forms & Inputs
- Text inputs: Outlined style with focus ring
- Address inputs: Monospace font, validation indicators (checkmark/x)
- Amount inputs: Large, with denomination selector (BTC/satoshis)
- All forms: Clear labels above inputs, helper text below
- Submit buttons: Full-width on mobile, fixed-width on desktop

### Data Visualization
- **Network Graph:** Simple node diagram for P2P connections (if showing network)
- **Hashrate Chart:** Line chart showing mining difficulty over time
- **UTXO Diagram:** Sankey-style flow from inputs to outputs
- **Block Timeline:** Horizontal timeline showing recent blocks with connecting lines

### Status Indicators
- Transaction status: Pill badges (Pending: yellow, Confirmed: green, Failed: red)
- Network status: Dot indicator (Syncing, Synced, Offline)
- Block confirmations: Progress bar with count (0/6 confirmations)

### Search
- Global search bar in header
- Searches: block height, block hash, transaction ID, address
- Autocomplete suggestions
- Search results page: Categorized by type (blocks, transactions, addresses)

---

## Animations

**Minimal, purposeful animations:**
- Real-time block/transaction arrivals: Subtle slide-in from top
- Confirmation progress: Smooth progress bar fills
- Copy-to-clipboard: Brief checkmark animation
- Mining hashrate: Smooth line chart updates
- NO hover effects, NO page transitions, NO decorative animations

---

## Images

**Hero Section:** Full-width abstract blockchain network visualization (nodes and connections, geometric/technical aesthetic) - approximately 60vh height
- Overlay: Semi-transparent dark gradient for text readability
- Buttons on hero: Background blur (backdrop-blur-md) with semi-transparent background

**Additional Images:**
- QR codes for wallet addresses (generated, not static images)
- Network topology diagram (if P2P visualization needed)
- No decorative images elsewhere - focus on data and functionality

---

## Accessibility & Best Practices

- All technical data (hashes, addresses) copyable with one click
- Keyboard navigation for all interactive elements
- Focus indicators on all interactive elements
- ARIA labels for icon-only buttons
- Responsive tables: Horizontal scroll on mobile with sticky first column
- Monospace fonts always used for technical data (prevents misreading)
- Clear visual distinction between similar data types (addresses vs. hashes vs. transaction IDs)