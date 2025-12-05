import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight, Hash, Clock, Blocks, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "@/components/copy-button";
import { PageLoadingSkeleton } from "@/components/loading-skeleton";
import { 
  formatTimestamp, 
  formatRelativeTime, 
  formatSatoshis,
  truncateAddress,
  getConfirmationStatus
} from "@/lib/blockchain-utils";
import type { Transaction } from "@shared/schema";

export default function TransactionDetail() {
  const { txid } = useParams<{ txid: string }>();

  const { data: transaction, isLoading, error } = useQuery<Transaction>({
    queryKey: ["/api/transaction", txid],
  });

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  if (error || !transaction) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="text-center py-12">
            <Hash className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-2xl font-bold">Transaction Not Found</h2>
            <p className="text-muted-foreground mt-2">
              The transaction you're looking for doesn't exist.
            </p>
            <Link href="/explorer">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Explorer
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCoinbase = transaction.inputs.length === 1 && transaction.inputs[0].txid === "0".repeat(64);
  const totalInput = isCoinbase ? 0 : transaction.inputs.reduce((sum, input) => sum + 0, 0);
  const totalOutput = transaction.outputs.reduce((sum, out) => sum + out.value, 0);
  const status = getConfirmationStatus(transaction.confirmations);

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/explorer">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">Transaction Details</h1>
              {isCoinbase && (
                <Badge variant="outline" className="bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400">
                  Coinbase
                </Badge>
              )}
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatTimestamp(transaction.timestamp)}</span>
              <span className="text-xs">({formatRelativeTime(transaction.timestamp)})</span>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Transaction ID
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="font-mono text-sm break-all bg-muted px-3 py-2 rounded-md flex-1" data-testid="text-txid">
                {transaction.txid}
              </code>
              <CopyButton text={transaction.txid} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {transaction.blockHeight !== undefined && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                    <Blocks className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Block</div>
                    <Link href={`/explorer/block/${transaction.blockHash}`}>
                      <div className="text-xl font-bold text-primary hover:underline" data-testid="link-block">
                        #{transaction.blockHeight}
                      </div>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                  <Coins className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Output</div>
                  <div className="text-xl font-bold tabular-nums" data-testid="text-total-output">
                    {formatSatoshis(totalOutput)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                  <Coins className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Fee</div>
                  <div className="text-xl font-bold tabular-nums" data-testid="text-fee">
                    {formatSatoshis(transaction.fee)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>UTXO Flow</CardTitle>
            <CardDescription>
              Transaction inputs and outputs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-[1fr_auto_1fr]">
              <div className="space-y-3">
                <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Inputs ({transaction.inputs.length})
                </div>
                {isCoinbase ? (
                  <div className="p-4 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium text-yellow-600 dark:text-yellow-400">Block Reward</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Newly minted coins
                    </div>
                  </div>
                ) : (
                  transaction.inputs.map((input, index) => (
                    <div key={index} className="p-3 rounded-md bg-muted/50">
                      <div className="font-mono text-xs text-muted-foreground break-all">
                        {truncateAddress(input.txid, 12, 12)}:{input.vout}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="h-8 w-8 text-muted-foreground" />
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Outputs ({transaction.outputs.length})
                </div>
                {transaction.outputs.map((output, index) => (
                  <div key={index} className="p-3 rounded-md bg-muted/50">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">Output #{index}</span>
                      <span className="font-bold tabular-nums text-sm">
                        {formatSatoshis(output.value)} CREED
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs break-all flex-1">
                        {output.address}
                      </code>
                      <CopyButton text={output.address} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Technical Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Version</div>
                <div className="font-medium font-mono">{transaction.version}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Locktime</div>
                <div className="font-medium font-mono">{transaction.locktime}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Confirmations</div>
                <div className="font-medium">{transaction.confirmations}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Size</div>
                <div className="font-medium">~{JSON.stringify(transaction).length} bytes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
