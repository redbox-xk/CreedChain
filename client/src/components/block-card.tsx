import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Blocks, Clock, FileText, Hash } from "lucide-react";
import { CopyButton } from "@/components/copy-button";
import { truncateHash, formatRelativeTime, formatBlockSize } from "@/lib/blockchain-utils";
import type { Block } from "@shared/schema";

interface BlockCardProps {
  block: Block;
}

export function BlockCard({ block }: BlockCardProps) {
  return (
    <Link href={`/explorer/block/${block.hash}`}>
      <Card className="hover-elevate active-elevate-2 cursor-pointer transition-all" data-testid={`card-block-${block.height}`}>
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Blocks className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">Block #{block.height}</span>
                {block.confirmations >= 6 ? (
                  <Badge variant="default" className="text-xs">Confirmed</Badge>
                ) : block.confirmations > 0 ? (
                  <Badge variant="outline" className="text-xs">{block.confirmations} conf</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Pending</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatRelativeTime(block.header.timestamp)}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="h-3 w-3" />
                <span className="font-mono text-xs">{truncateHash(block.hash, 12, 12)}</span>
              </div>
              <div onClick={(e) => e.preventDefault()}>
                <CopyButton text={block.hash} />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-3 w-3" />
                <span>{block.transactions.length} transactions</span>
              </div>
              <span className="text-muted-foreground">{formatBlockSize(block.size)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
