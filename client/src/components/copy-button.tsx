import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/blockchain-utils";
import { useToast } from "@/hooks/use-toast";

interface CopyButtonProps {
  text: string;
  size?: "default" | "sm" | "icon";
  className?: string;
}

export function CopyButton({ text, size = "icon", className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "The value has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleCopy}
      className={className}
      data-testid="button-copy"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}
