import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Blocks, ArrowRightLeft, Zap, Coins, ChevronRight, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { BlockCard } from "@/components/block-card";
import { TransactionCard } from "@/components/transaction-card";
import { ChainVisualization } from "@/components/chain-visualization";
import { StatCardSkeleton, BlockCardSkeleton, TransactionCardSkeleton } from "@/components/loading-skeleton";
import { formatHashrate, formatNumber } from "@/lib/blockchain-utils";
import type { Block, Transaction, NetworkStats } from "@shared/schema";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<NetworkStats>({
    queryKey: ["/api/stats"],
  });

  const { data: blocks, isLoading: blocksLoading } = useQuery<Block[]>({
    queryKey: ["/api/blocks"],
  });

  const { data: transactions, isLoading: txLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/recent"],
  });

  const recentBlocks = blocks?.slice(0, 5) || [];
  const recentTx = transactions?.slice(0, 5) || [];

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time blockchain network overview
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : stats ? (
            <>
              <StatCard
                title="Block Height"
                value={formatNumber(stats.blockHeight)}
                subtitle={`${stats.avgBlockTime / 1000}s avg block time`}
                icon={Blocks}
                testId="stat-block-height"
              />
              <StatCard
                title="Total Transactions"
                value={formatNumber(stats.totalTransactions)}
                subtitle={`${stats.mempoolSize} pending in mempool`}
                icon={ArrowRightLeft}
                testId="stat-total-tx"
              />
              <StatCard
                title="Network Hashrate"
                value={formatHashrate(stats.hashrate)}
                subtitle={`Difficulty: ${stats.difficulty}`}
                icon={Zap}
                testId="stat-hashrate"
              />
              <StatCard
                title="Total Supply"
                value={`${(stats.totalSupply / 100000000).toFixed(2)}`}
                subtitle={`${(stats.circulatingSupply / 100000000).toFixed(2)} circulating`}
                icon={Coins}
                testId="stat-supply"
              />
            </>
          ) : null}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Network Status</CardTitle>
            </div>
            {stats && (
              <Badge 
                variant={stats.syncStatus === "synced" ? "default" : "secondary"}
                className="text-xs"
              >
                {stats.syncStatus === "synced" ? "Synced" : stats.syncStatus === "syncing" ? "Syncing..." : "Offline"}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {blocksLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recentBlocks.length > 0 ? (
              <ChainVisualization blocks={recentBlocks} maxBlocks={6} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No blocks yet. Start mining to create the first block!
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Blocks className="h-5 w-5" />
                Recent Blocks
              </CardTitle>
              <Link href="/explorer">
                <Button variant="ghost" size="sm" data-testid="link-view-all-blocks">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {blocksLoading ? (
                <>
                  <BlockCardSkeleton />
                  <BlockCardSkeleton />
                  <BlockCardSkeleton />
                </>
              ) : recentBlocks.length > 0 ? (
                recentBlocks.map((block) => (
                  <BlockCard key={block.hash} block={block} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No blocks yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
              <Link href="/explorer">
                <Button variant="ghost" size="sm" data-testid="link-view-all-tx">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {txLoading ? (
                <>
                  <TransactionCardSkeleton />
                  <TransactionCardSkeleton />
                  <TransactionCardSkeleton />
                </>
              ) : recentTx.length > 0 ? (
                recentTx.map((tx) => (
                  <TransactionCard key={tx.txid} transaction={tx} showDetails={false} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
