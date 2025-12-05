import { Link } from "wouter";
import { truncateHash } from "@/lib/blockchain-utils";
import type { Block } from "@shared/schema";

interface ChainVisualizationProps {
  blocks: Block[];
  maxBlocks?: number;
}

export function ChainVisualization({ blocks, maxBlocks = 6 }: ChainVisualizationProps) {
  const displayBlocks = blocks.slice(0, maxBlocks);

  return (
    <div className="w-full overflow-x-auto pb-4" data-testid="chain-visualization">
      <div className="flex items-center gap-1 min-w-max px-2">
        {displayBlocks.map((block, index) => (
          <div key={block.hash} className="flex items-center">
            <Link href={`/explorer/block/${block.hash}`}>
              <div 
                className="flex flex-col items-center p-3 rounded-md bg-card border hover-elevate active-elevate-2 cursor-pointer transition-all min-w-[120px]"
                data-testid={`block-viz-${block.height}`}
              >
                <div className="text-lg font-bold">#{block.height}</div>
                <div className="font-mono text-xs text-muted-foreground mt-1">
                  {truncateHash(block.hash, 4, 4)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {block.transactions.length} txs
                </div>
              </div>
            </Link>
            {index < displayBlocks.length - 1 && (
              <div className="w-8 h-0.5 bg-border mx-1 flex-shrink-0" />
            )}
          </div>
        ))}
        {blocks.length > maxBlocks && (
          <div className="flex items-center">
            <div className="w-8 h-0.5 bg-border mx-1 flex-shrink-0" />
            <div className="text-muted-foreground text-sm">
              +{blocks.length - maxBlocks} more
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
