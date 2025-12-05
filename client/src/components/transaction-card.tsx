import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, Hash } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { truncateHash, truncateAddress, formatSatoshis, formatRelativeTime, getConfirmationStatus } from "@/lib/blockchain-utils";
import type { Transaction } from "@shared/schema";

interface TransactionCardProps {
  transaction: Transaction;
  showDetails?: boolean;
}

export function TransactionCard({ transaction, showDetails = true }: TransactionCardProps) {
  const isCoinbase = transaction.inputs.length === 1 && transaction.inputs[0].txid === "0".repeat(64);
  const totalOutput = transaction.outputs.reduce((sum, out) => sum + out.value, 0);
  const status = getConfirmationStatus(transaction.confirmations);

  return (
    <Link href={`/explorer/tx/${transaction.txid}`}>
      <Card className="hover-elevate active-elevate-2 cursor-pointer transition-all" data-testid={`card-tx-${transaction.txid.slice(0, 8)}`}>
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-sm">{truncateHash(transaction.txid, 10, 10)}</span>
            </div>
            <div onClick={(e) => e.preventDefault()}>
              <CopyButton text={transaction.txid} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isCoinbase && (
              <Badge variant="outline" className="text-xs bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400">
                Coinbase
              </Badge>
            )}
            <Badge variant={status.variant} className="text-xs">
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        
        {showDetails && (
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatRelativeTime(transaction.timestamp)}</span>
                {transaction.blockHeight !== undefined && (
                  <>
                    <span className="mx-1">|</span>
                    <span>Block #{transaction.blockHeight}</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">From</div>
                  {isCoinbase ? (
                    <div className="text-sm text-muted-foreground italic">Block Reward</div>
                  ) : (
                    <div className="space-y-1">
                      {transaction.inputs.slice(0, 2).map((input, i) => (
                        <div key={i} className="font-mono text-xs text-muted-foreground">
                          {truncateAddress(input.txid, 8, 6)}
                        </div>
                      ))}
                      {transaction.inputs.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{transaction.inputs.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                
                <div className="flex-1 space-y-1 text-right">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">To</div>
                  <div className="space-y-1">
                    {transaction.outputs.slice(0, 2).map((output, i) => (
                      <div key={i} className="font-mono text-xs">
                        {truncateAddress(output.address, 8, 6)}
                      </div>
                    ))}
                    {transaction.outputs.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{transaction.outputs.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Total Output</span>
                <span className="text-lg font-semibold tabular-nums">
                  {formatSatoshis(totalOutput)} CREED
                </span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
