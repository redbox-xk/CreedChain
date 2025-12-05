import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Pickaxe, Zap, Cpu, Award } from "lucide-react";
import { formatHashrate, formatSatoshis } from "@/lib/blockchain-utils";
import type { MiningStats } from "@shared/schema";

interface MiningCardProps {
  stats: MiningStats;
  onToggleMining: () => void;
  isLoading?: boolean;
}

export function MiningCard({ stats, onToggleMining, isLoading }: MiningCardProps) {
  const miningDuration = stats.startTime ? Date.now() - stats.startTime : 0;
  const miningMinutes = Math.floor(miningDuration / 60000);
  const miningSeconds = Math.floor((miningDuration % 60000) / 1000);

  return (
    <Card className="overflow-visible" data-testid="card-mining">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-md ${stats.isActive ? 'bg-green-500/20' : 'bg-muted'}`}>
            <Pickaxe className={`h-6 w-6 ${stats.isActive ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <CardTitle className="text-xl">Mining</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={stats.isActive ? "default" : "secondary"} className="text-xs">
                {stats.isActive ? "Active" : "Inactive"}
              </Badge>
              {stats.isActive && stats.startTime && (
                <span className="text-xs text-muted-foreground">
                  Running for {miningMinutes}m {miningSeconds}s
                </span>
              )}
            </div>
          </div>
        </div>
        <Button
          variant={stats.isActive ? "destructive" : "default"}
          size="lg"
          onClick={onToggleMining}
          disabled={isLoading}
          data-testid="button-toggle-mining"
        >
          {isLoading ? (
            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : stats.isActive ? (
            "Stop Mining"
          ) : (
            "Start Mining"
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              <span className="uppercase tracking-wide text-xs font-medium">Hashrate</span>
            </div>
            <div className="text-2xl font-bold tabular-nums" data-testid="text-hashrate">
              {formatHashrate(stats.hashrate)}
            </div>
            {stats.isActive && (
              <Progress value={Math.min((stats.hashrate / 1000) * 100, 100)} className="h-1" />
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Cpu className="h-4 w-4" />
              <span className="uppercase tracking-wide text-xs font-medium">Current Nonce</span>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums" data-testid="text-nonce">
              {stats.currentNonce.toLocaleString()}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="h-4 w-4" />
              <span className="uppercase tracking-wide text-xs font-medium">Blocks Found</span>
            </div>
            <div className="text-2xl font-bold tabular-nums" data-testid="text-blocks-found">
              {stats.blocksFound}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="h-4 w-4 text-yellow-500" />
              <span className="uppercase tracking-wide text-xs font-medium">Total Rewards</span>
            </div>
            <div className="text-2xl font-bold tabular-nums" data-testid="text-total-rewards">
              {formatSatoshis(stats.totalRewards)}
            </div>
            <div className="text-xs text-muted-foreground">CREED</div>
          </div>
        </div>
        
        {stats.isActive && (
          <div className="mt-6 p-4 rounded-md bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Target Hash</span>
              <span className="text-xs text-muted-foreground">Difficulty: {stats.difficulty}</span>
            </div>
            <code className="font-mono text-xs text-muted-foreground break-all">
              {stats.targetHash}
            </code>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
