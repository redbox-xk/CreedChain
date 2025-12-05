import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, Blocks, ArrowRightLeft, Wallet, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { truncateHash } from "@/lib/blockchain-utils";
import type { SearchResult } from "@shared/schema";

export default function SearchPage() {
  const [location] = useLocation();
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    const q = params.get("q") || "";
    setQuery(q);
    setSearchQuery(q);
  }, [location]);

  const { data: results, isLoading, error } = useQuery<SearchResult[]>({
    queryKey: ["/api/search", searchQuery],
    enabled: !!searchQuery,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(query);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "block":
        return <Blocks className="h-5 w-5" />;
      case "transaction":
        return <ArrowRightLeft className="h-5 w-5" />;
      case "address":
        return <Wallet className="h-5 w-5" />;
      default:
        return <Search className="h-5 w-5" />;
    }
  };

  const getLink = (result: SearchResult) => {
    switch (result.type) {
      case "block":
        return `/explorer/block/${result.id}`;
      case "transaction":
        return `/explorer/tx/${result.id}`;
      case "address":
        return `/explorer/address/${result.id}`;
      default:
        return "/explorer";
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Search</h1>
          <p className="text-muted-foreground mt-1">
            Search for blocks, transactions, or addresses
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter block height, block hash, transaction ID, or address..."
              className="pl-10 font-mono h-12"
              data-testid="input-search-main"
            />
          </div>
          <Button type="submit" size="lg" className="h-12" data-testid="button-search">
            Search
          </Button>
        </form>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="text-center text-destructive">
                Error searching. Please try again.
              </div>
            </CardContent>
          </Card>
        )}

        {results && results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>
                Found {results.length} result{results.length !== 1 ? "s" : ""} for "{searchQuery}"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {results.map((result, index) => (
                <Link key={`${result.type}-${result.id}-${index}`} href={getLink(result)}>
                  <div className="flex items-center gap-4 p-4 rounded-md hover-elevate active-elevate-2 cursor-pointer border" data-testid={`result-${result.type}-${index}`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {result.type}
                        </Badge>
                      </div>
                      <div className="font-mono text-sm truncate mt-1">
                        {truncateHash(result.id, 16, 16)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {result.preview}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {results && results.length === 0 && searchQuery && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium">No results found</h3>
                <p className="text-muted-foreground mt-1">
                  Try searching with a different query
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!searchQuery && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium">Search the Blockchain</h3>
                <p className="text-muted-foreground mt-1">
                  You can search for:
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  <Badge variant="outline">Block height (e.g., 42)</Badge>
                  <Badge variant="outline">Block hash</Badge>
                  <Badge variant="outline">Transaction ID</Badge>
                  <Badge variant="outline">Address</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
