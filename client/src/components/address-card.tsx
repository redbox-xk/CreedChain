import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { Wallet, ArrowUpRight, ArrowDownLeft, QrCode } from "lucide-react";
import { formatSatoshis, truncateAddress } from "@/lib/blockchain-utils";
import type { Address } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AddressCardProps {
  address: Address;
  isActive?: boolean;
  onSend?: (address: string) => void;
  onReceive?: (address: string) => void;
}

export function AddressCard({ address, isActive, onSend, onReceive }: AddressCardProps) {
  return (
    <Card className={`transition-all ${isActive ? 'border-primary' : ''}`} data-testid={`card-address-${address.address.slice(0, 8)}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm">{truncateAddress(address.address, 10, 8)}</span>
              <CopyButton text={address.address} />
            </div>
            {address.label && (
              <span className="text-xs text-muted-foreground">{address.label}</span>
            )}
          </div>
        </div>
        {isActive && (
          <Badge variant="default" className="text-xs">Active</Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Balance</div>
            <div className="text-2xl font-bold tabular-nums" data-testid="text-address-balance">
              {formatSatoshis(address.balance)} CREED
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onSend?.(address.address)}
              data-testid="button-send"
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Send
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  data-testid="button-receive"
                >
                  <ArrowDownLeft className="h-4 w-4 mr-2" />
                  Receive
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Receive CREED</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-white p-4">
                    <QrCode className="h-full w-full text-black" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Your Address</p>
                    <div className="flex items-center gap-2 justify-center">
                      <code className="font-mono text-xs bg-muted px-2 py-1 rounded break-all">
                        {address.address}
                      </code>
                      <CopyButton text={address.address} />
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
