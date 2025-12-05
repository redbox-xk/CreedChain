import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { ArrowLeft, ArrowRight, Blocks, Clock, Hash, FileText, Cpu, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TransactionCard } from "@/components/transaction-card";
import { CopyButton } from "@/components/copy-button";
import { PageLoadingSkeleton, TransactionCardSkeleton } from "@/components/loading-skeleton";
import { 
  formatTimestamp, 
  formatRelativeTime, 
  formatBlockSize, 
  truncateHash,
  getConfirmationStatus
} from "@/lib/blockchain-utils";
import type { Block } from "@shared/schema";

export default function BlockDetail() {
  const { hash } = useParams<{ hash: string }>();

  const { data: block, isLoading, error } = useQuery<Block>({
    queryKey: ["/api/block", hash],
  });

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  if (error || !block) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="text-center py-12">
            <Blocks className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-2xl font-bold">Block Not Found</h2>
            <p className="text-muted-foreground mt-2">
              The block you're looking for doesn't exist or hasn't been mined yet.
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

  const status = getConfirmationStatus(block.confirmations);

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
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold">Block #{block.height}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatTimestamp(block.header.timestamp)}</span>
              <span className="text-xs">({formatRelativeTime(block.header.timestamp)})</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {block.height > 0 && (
              <Link href={`/explorer/block/${block.header.prevHash}`}>
                <Button variant="outline" size="sm" data-testid="button-prev-block">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Prev
                </Button>
              </Link>
            )}
            <Link href={`/explorer`}>
              <Button variant="outline" size="sm" data-testid="button-next-block">
                Next
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Block Hash
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="font-mono text-sm break-all bg-muted px-3 py-2 rounded-md flex-1" data-testid="text-block-hash">
                {block.hash}
              </code>
              <CopyButton text={block.hash} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Transactions</div>
                  <div className="text-xl font-bold" data-testid="text-tx-count">{block.transactions.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                  <Target className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Difficulty</div>
                  <div className="text-xl font-bold" data-testid="text-difficulty">{block.header.difficulty}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                  <Cpu className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Nonce</div>
                  <div className="text-xl font-bold font-mono" data-testid="text-nonce">{block.header.nonce.toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Block Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Size</div>
                <div className="font-medium">{formatBlockSize(block.size)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Weight</div>
                <div className="font-medium">{block.weight.toLocaleString()} WU</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Version</div>
                <div className="font-medium font-mono">{block.header.version}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Confirmations</div>
                <div className="font-medium">{block.confirmations}</div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide mb-2">Previous Block Hash</div>
              <div className="flex items-center gap-2">
                <code className="font-mono text-xs bg-muted px-2 py-1 rounded break-all">
                  {block.header.prevHash}
                </code>
                <CopyButton text={block.header.prevHash} />
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide mb-2">Merkle Root</div>
              <div className="flex items-center gap-2">
                <code className="font-mono text-xs bg-muted px-2 py-1 rounded break-all">
                  {block.header.merkleRoot}
                </code>
                <CopyButton text={block.header.merkleRoot} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Transactions in this Block
            </CardTitle>
            <CardDescription>
              {block.transactions.length} transaction{block.transactions.length !== 1 ? 's' : ''} included
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {block.transactions.length > 0 ? (
              block.transactions.map((tx) => (
                <TransactionCard key={tx.txid} transaction={tx} />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No transactions in this block
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
