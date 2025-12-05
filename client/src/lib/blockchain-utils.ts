// Utility functions for blockchain operations

export function truncateHash(hash: string, startChars = 8, endChars = 8): string {
  if (hash.length <= startChars + endChars) return hash;
  return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
}

export function truncateAddress(address: string, startChars = 6, endChars = 4): string {
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

export function formatSatoshis(satoshis: number): string {
  const btc = satoshis / 100000000;
  return btc.toLocaleString(undefined, {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
  });
}

export function formatBTC(btc: number): string {
  return btc.toLocaleString(undefined, {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
  });
}

export function formatHashrate(hashrate: number): string {
  if (hashrate >= 1e12) {
    return `${(hashrate / 1e12).toFixed(2)} TH/s`;
  } else if (hashrate >= 1e9) {
    return `${(hashrate / 1e9).toFixed(2)} GH/s`;
  } else if (hashrate >= 1e6) {
    return `${(hashrate / 1e6).toFixed(2)} MH/s`;
  } else if (hashrate >= 1e3) {
    return `${(hashrate / 1e3).toFixed(2)} KH/s`;
  }
  return `${hashrate.toFixed(2)} H/s`;
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

export function formatBlockSize(bytes: number): string {
  if (bytes >= 1e6) {
    return `${(bytes / 1e6).toFixed(2)} MB`;
  } else if (bytes >= 1e3) {
    return `${(bytes / 1e3).toFixed(2)} KB`;
  }
  return `${bytes} B`;
}

export function formatDifficulty(difficulty: number): string {
  if (difficulty >= 1e12) {
    return `${(difficulty / 1e12).toFixed(2)}T`;
  } else if (difficulty >= 1e9) {
    return `${(difficulty / 1e9).toFixed(2)}G`;
  } else if (difficulty >= 1e6) {
    return `${(difficulty / 1e6).toFixed(2)}M`;
  } else if (difficulty >= 1e3) {
    return `${(difficulty / 1e3).toFixed(2)}K`;
  }
  return difficulty.toString();
}

export function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function calculateConfirmationColor(confirmations: number): string {
  if (confirmations === 0) return "text-yellow-500";
  if (confirmations < 3) return "text-orange-500";
  if (confirmations < 6) return "text-blue-500";
  return "text-green-500";
}

export function getConfirmationStatus(confirmations: number): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  if (confirmations === 0) {
    return { label: "Pending", variant: "secondary" };
  } else if (confirmations < 6) {
    return { label: `${confirmations} confirmations`, variant: "outline" };
  }
  return { label: "Confirmed", variant: "default" };
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
