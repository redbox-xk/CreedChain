import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Blocks, ArrowRightLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BlockCard } from "@/components/block-card";
import { TransactionCard } from "@/components/transaction-card";
import { SearchBar } from "@/components/search-bar";
import { BlockCardSkeleton, TransactionCardSkeleton } from "@/components/loading-skeleton";
import type { Block, Transaction } from "@shared/schema";

export default function Explorer() {
  const [activeTab, setActiveTab] = useState("blocks");

  const { data: blocks, isLoading: blocksLoading } = useQuery<Block[]>({
    queryKey: ["/api/blocks"],
  });

  const { data: transactions, isLoading: txLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Explorer</h1>
            <p className="text-muted-foreground mt-1">
              Browse blocks, transactions, and addresses
            </p>
          </div>
          <SearchBar className="w-full md:w-96" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="blocks" data-testid="tab-blocks">
              <Blocks className="h-4 w-4 mr-2" />
              Blocks
            </TabsTrigger>
            <TabsTrigger value="transactions" data-testid="tab-transactions">
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="blocks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Blocks</CardTitle>
                <CardDescription>
                  {blocks?.length || 0} blocks on the blockchain
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {blocksLoading ? (
                  <>
                    <BlockCardSkeleton />
                    <BlockCardSkeleton />
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
                    <Blocks className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No blocks yet</p>
                    <p className="text-sm mt-1">Start mining to create the first block!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Transactions</CardTitle>
                <CardDescription>
                  {transactions?.length || 0} transactions recorded
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {txLoading ? (
                  <>
                    <TransactionCardSkeleton />
                    <TransactionCardSkeleton />
                    <TransactionCardSkeleton />
                    <TransactionCardSkeleton />
                    <TransactionCardSkeleton />
                  </>
                ) : transactions && transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <TransactionCard key={tx.txid} transaction={tx} />
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No transactions yet</p>
                    <p className="text-sm mt-1">Transactions will appear here when blocks are mined</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
