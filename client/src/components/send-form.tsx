import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { formatSatoshis } from "@/lib/blockchain-utils";

const sendFormSchema = z.object({
  toAddress: z.string().min(26, "Address must be at least 26 characters").max(62, "Address too long"),
  amount: z.number().positive("Amount must be positive"),
  fee: z.number().min(0.00001, "Fee too low"),
});

type SendFormValues = z.infer<typeof sendFormSchema>;

interface SendFormProps {
  fromAddress: string;
  maxBalance: number;
  onSubmit: (data: SendFormValues) => void;
  isPending?: boolean;
}

export function SendForm({ fromAddress, maxBalance, onSubmit, isPending }: SendFormProps) {
  const form = useForm<SendFormValues>({
    resolver: zodResolver(sendFormSchema),
    defaultValues: {
      toAddress: "",
      amount: 0,
      fee: 0.0001,
    },
  });

  const fee = form.watch("fee");
  const amount = form.watch("amount");
  const total = amount + fee;

  return (
    <Card data-testid="card-send-form">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpRight className="h-5 w-5" />
          Send CREED
        </CardTitle>
        <CardDescription>
          Send cryptocurrency to another address
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="p-3 rounded-md bg-muted/50 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">From</span>
                <span className="font-mono text-xs">{fromAddress}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-muted-foreground">Available</span>
                <span className="font-medium">{formatSatoshis(maxBalance)} CREED</span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="toAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter recipient address"
                      className="font-mono"
                      {...field}
                      data-testid="input-recipient-address"
                    />
                  </FormControl>
                  <FormDescription>
                    The CREEDchain address to send to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.00000001"
                        placeholder="0.00000000"
                        className="pr-16 font-mono"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        data-testid="input-amount"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        CREED
                      </div>
                    </div>
                  </FormControl>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Min: 0.00000001</span>
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-xs"
                      onClick={() => form.setValue("amount", Math.max(0, maxBalance / 100000000 - fee))}
                      data-testid="button-max-amount"
                    >
                      Max
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fee"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Transaction Fee</FormLabel>
                    <span className="text-sm font-mono">{field.value.toFixed(8)} CREED</span>
                  </div>
                  <FormControl>
                    <Slider
                      min={0.00001}
                      max={0.001}
                      step={0.00001}
                      value={[field.value]}
                      onValueChange={(v) => field.onChange(v[0])}
                      data-testid="slider-fee"
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="p-4 rounded-md bg-muted/50 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span>{amount.toFixed(8)} CREED</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fee</span>
                <span>{fee.toFixed(8)} CREED</span>
              </div>
              <div className="flex items-center justify-between font-medium pt-2 border-t">
                <span>Total</span>
                <span>{total.toFixed(8)} CREED</span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isPending || total > maxBalance / 100000000}
              data-testid="button-send-submit"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Send Transaction
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
