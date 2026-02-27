import { useQuery, useMutation } from "@tanstack/react-query";
import { Pickaxe, Zap, Blocks, Award, Clock, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MiningCard } from "@/components/mining-card";
import { StatCard } from "@/components/stat-card";
import { BlockCard } from "@/components/block-card";
import { MiningCardSkeleton, StatCardSkeleton, BlockCardSkeleton } from "@/components/loading-skeleton";
import { formatHashrate, formatSatoshis, formatNumber } from "@/lib/blockchain-utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { MiningStats, NetworkStats, Block, Wallet } from "@shared/schema";

export default function MiningPage() {
  const { toast } = useToast();

  const { data: miningStats, isLoading: miningLoading } = useQuery<MiningStats>({
    queryKey: ["/api/mining/stats"],
    refetchInterval: 1000,
  });

  const { data: networkStats, isLoading: networkLoading } = useQuery<NetworkStats>({
    queryKey: ["/api/stats"],
  });

  const { data: wallet } = useQuery<Wallet>({
    queryKey: ["/api/wallet"],
  });

  const { data: blocks, isLoading: blocksLoading } = useQuery<Block[]>({
    queryKey: ["/api/blocks/mined"],
  });

  const toggleMiningMutation = useMutation({
    mutationFn: async (action: "start" | "stop") => {
      // Find the first address that belongs to a wallet
      const minerAddress = wallet?.addresses[0]?.address;
      
      if (action === "start") {
        if (!wallet) {
          throw new Error("Please create a wallet first to receive mining rewards.");
        }
        if (!minerAddress) {
          throw new Error("Your wallet must have at least one address to receive rewards.");
        }
      }
      
      return apiRequest("POST", `/api/mining/${action}`, { minerAddress });
    },
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ["/api/mining/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: action === "start" ? "Mining Started" : "Mining Stopped",
        description: action === "start" 
          ? "Your node is now mining for new blocks!" 
          : "Mining has been stopped.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleMining = () => {
    const action = miningStats?.isActive ? "stop" : "start";
    toggleMiningMutation.mutate(action);
  };

  const defaultMiningStats: MiningStats = {
    isActive: false,
    hashrate: 0,
    blocksFound: 0,
    totalRewards: 0,
    currentNonce: 0,
    difficulty: networkStats?.difficulty || 4,
    targetHash: "0".repeat(64),
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Mining</h1>
          <p className="text-muted-foreground mt-1">
            Mine new blocks and earn CREED rewards
          </p>
        </div>

        {miningLoading ? (
          <MiningCardSkeleton />
        ) : (
          <MiningCard
            stats={miningStats || defaultMiningStats}
            onToggleMining={handleToggleMining}
            isLoading={toggleMiningMutation.isPending}
          />
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {networkLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : networkStats ? (
            <>
              <StatCard
                title="Network Difficulty"
                value={networkStats.difficulty.toString()}
                subtitle="Current mining difficulty"
                icon={Target}
                testId="stat-difficulty"
              />
              <StatCard
                title="Block Reward"
                value={`${networkStats.blockReward / 100000000}`}
                subtitle="CREED per block"
                icon={Award}
                testId="stat-reward"
              />
              <StatCard
                title="Avg Block Time"
                value={`${networkStats.avgBlockTime / 1000}s`}
                subtitle="Target: 10s"
                icon={Clock}
                testId="stat-block-time"
              />
              <StatCard
                title="Network Hashrate"
                value={formatHashrate(networkStats.hashrate)}
                subtitle="Total network power"
                icon={Zap}
                testId="stat-network-hashrate"
              />
            </>
          ) : null}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Blocks className="h-5 w-5" />
              Your Mined Blocks
            </CardTitle>
            <CardDescription>
              Blocks you've successfully mined
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {blocksLoading ? (
              <>
                <BlockCardSkeleton />
                <BlockCardSkeleton />
                <BlockCardSkeleton />
              </>
            ) : blocks && blocks.length > 0 ? (
              blocks.map((block) => (
                <BlockCard key={block.hash} block={block} />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Pickaxe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No blocks mined yet</p>
                <p className="text-sm mt-1">Start mining to earn CREED rewards!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mining Guide</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-md bg-muted/50">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">1</span>
                  Create a Wallet
                </h4>
                <p className="text-sm text-muted-foreground">
                  You need a wallet address to receive mining rewards. Go to the Wallet page and create one if you haven't already.
                </p>
              </div>
              <div className="p-4 rounded-md bg-muted/50">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">2</span>
                  Start Mining
                </h4>
                <p className="text-sm text-muted-foreground">
                  Click "Start Mining" to begin solving proof-of-work puzzles. Your browser will use CPU power to mine.
                </p>
              </div>
              <div className="p-4 rounded-md bg-muted/50">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">3</span>
                  Find Blocks
                </h4>
                <p className="text-sm text-muted-foreground">
                  When you find a valid block, it's added to the chain and you receive the block reward in CREED coins.
                </p>
              </div>
              <div className="p-4 rounded-md bg-muted/50">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">4</span>
                  Collect Rewards
                </h4>
                <p className="text-sm text-muted-foreground">
                  Block rewards mature after 6 confirmations. Then you can spend them from your wallet!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
