import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Wallet, Plus, ArrowUpRight, Coins, Key, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { AddressCard } from "@/components/address-card";
import { SendForm } from "@/components/send-form";
import { TransactionCard } from "@/components/transaction-card";
import { AddressCardSkeleton, TransactionCardSkeleton } from "@/components/loading-skeleton";
import { formatSatoshis } from "@/lib/blockchain-utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Wallet as WalletType, Address, Transaction } from "@shared/schema";

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState("addresses");
  const [walletName, setWalletName] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: wallet, isLoading: walletLoading } = useQuery<WalletType>({
    queryKey: ["/api/wallet"],
  });

  const { data: transactions, isLoading: txLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/wallet/transactions"],
  });

  const createWalletMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest("POST", "/api/wallet", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      setCreateDialogOpen(false);
      setWalletName("");
      toast({
        title: "Wallet Created",
        description: "Your new wallet has been created successfully.",
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

  const newAddressMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/wallet/address");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      toast({
        title: "Address Created",
        description: "A new address has been added to your wallet.",
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

  const sendMutation = useMutation({
    mutationFn: async (data: { toAddress: string; amount: number; fee: number }) => {
      return apiRequest("POST", "/api/transaction/send", {
        fromAddress: selectedAddress,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setSelectedAddress(null);
      toast({
        title: "Transaction Sent",
        description: "Your transaction has been broadcast to the network.",
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

  const totalBalance = wallet?.addresses.reduce((sum, addr) => sum + addr.balance, 0) || 0;
  const activeAddress = wallet?.addresses.find(a => a.address === selectedAddress) || wallet?.addresses[0];

  if (!wallet && !walletLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="max-w-md mx-auto text-center py-12">
            <Wallet className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Create Your Wallet</h1>
            <p className="text-muted-foreground mb-6">
              Get started by creating a new HD wallet. Your wallet will use BIP39 mnemonic phrases for secure key generation.
            </p>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" data-testid="button-create-wallet">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Wallet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Wallet</DialogTitle>
                  <DialogDescription>
                    Choose a name for your wallet. A secure mnemonic phrase will be generated for you.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="wallet-name">Wallet Name</Label>
                  <Input
                    id="wallet-name"
                    value={walletName}
                    onChange={(e) => setWalletName(e.target.value)}
                    placeholder="My Wallet"
                    className="mt-2"
                    data-testid="input-wallet-name"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => createWalletMutation.mutate(walletName)}
                    disabled={!walletName.trim() || createWalletMutation.isPending}
                    data-testid="button-confirm-create"
                  >
                    {createWalletMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">{wallet?.name || "My Wallet"}</h1>
            <p className="text-muted-foreground mt-1">
              Manage your addresses and send transactions
            </p>
          </div>
          <Button onClick={() => newAddressMutation.mutate()} disabled={newAddressMutation.isPending} data-testid="button-new-address">
            <Plus className="h-4 w-4 mr-2" />
            New Address
          </Button>
        </div>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide">Total Balance</div>
                <div className="text-4xl font-bold tabular-nums mt-1" data-testid="text-total-balance">
                  {formatSatoshis(totalBalance)} <span className="text-lg text-muted-foreground">CREED</span>
                </div>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <Coins className="h-8 w-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {wallet?.mnemonic && (
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <Key className="h-5 w-5" />
                Recovery Phrase
              </CardTitle>
              <CardDescription>
                Keep this phrase safe! Anyone with access can control your funds.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-3 rounded-md bg-yellow-500/10 font-mono text-sm break-all" data-testid="text-mnemonic">
                {wallet.mnemonic}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="addresses" data-testid="tab-addresses">
              Addresses
            </TabsTrigger>
            <TabsTrigger value="send" data-testid="tab-send">
              Send
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="addresses" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {walletLoading ? (
                <>
                  <AddressCardSkeleton />
                  <AddressCardSkeleton />
                </>
              ) : wallet?.addresses && wallet.addresses.length > 0 ? (
                wallet.addresses.map((address, index) => (
                  <AddressCard
                    key={address.address}
                    address={address}
                    isActive={index === 0}
                    onSend={(addr) => {
                      setSelectedAddress(addr);
                      setActiveTab("send");
                    }}
                  />
                ))
              ) : (
                <div className="col-span-2 text-center py-12 text-muted-foreground">
                  No addresses yet. Create one to get started!
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="send" className="space-y-4">
            {activeAddress ? (
              <SendForm
                fromAddress={activeAddress.address}
                maxBalance={activeAddress.balance}
                onSubmit={(data) => sendMutation.mutate(data)}
                isPending={sendMutation.isPending}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <ArrowUpRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Create an address first to send transactions</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  All transactions involving your addresses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {txLoading ? (
                  <>
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
                    No transactions yet
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
