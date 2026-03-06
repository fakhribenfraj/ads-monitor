"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, RefreshCw, DollarSign, LayoutGrid } from "lucide-react";
import type { Brief } from "@/types";

export type BriefsFilter = {
  status?: "ALL" | "PENDING" | "ACTIVE" | "COMPLETED";
  platform?: "ALL" | "tiktok" | "instagram";
  availability?: "ALL" | "available" | "full";
  category?: string;
};

interface BriefsListProps {
  filter?: BriefsFilter;
}

export function BriefsList({ filter }: BriefsListProps) {
  const POLLING_INTERVAL = 60000 * 5;

  const {
    data: briefsData,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["briefs"],
    queryFn: async () => {
      const response = await fetch("/api/briefs");
      if (!response.ok) {
        throw new Error("Failed to fetch briefs");
      }
      const data = await response.json();
      return data.response || [];
    },
    refetchInterval: POLLING_INTERVAL,
  });

  const getBriefCreators = (brief: Brief) =>
    Math.ceil(brief.numberCreators + brief.numberCreators / 2);

  const isAvailable = (brief: Brief) => {
    const threshold = getBriefCreators(brief);
    return brief.activeCreators < threshold;
  };

  const filteredBriefs = (briefsData || []).filter((brief: Brief) => {
    if (
      filter?.status &&
      filter.status !== "ALL" &&
      brief.status !== filter.status
    )
      return false;
    if (
      filter?.platform &&
      filter.platform !== "ALL" &&
      brief.platform?.[0] !== filter.platform
    )
      return false;
    if (filter?.availability === "available" && !isAvailable(brief))
      return false;
    if (filter?.availability === "full" && isAvailable(brief)) return false;
    if (
      filter?.category &&
      !brief.category.toLowerCase().includes(filter.category.toLowerCase())
    )
      return false;
    return true;
  });
  // console.log(filteredBriefs);
  const getProgressVariant = (brief: Brief) => {
    const percentage = (brief.activeCreators / getBriefCreators(brief)) * 100;
    if (percentage >= 75) return "destructive";
    if (percentage >= 50) return "warning";
    return "default";
  };

  const hasActiveFilters =
    filter &&
    (filter.status !== "ALL" ||
      filter.platform !== "ALL" ||
      filter.availability !== "ALL" ||
      filter.category !== "");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Briefs List
            </CardTitle>
            <CardDescription>
              {filteredBriefs.length} brief
              {filteredBriefs.length !== 1 ? "s" : ""} found
              {hasActiveFilters &&
                ` (filtered from ${briefsData?.length || 0})`}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredBriefs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <LayoutGrid className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No briefs match the criteria
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {filteredBriefs.map((brief: Brief) => (
                <div
                  key={brief.id}
                  className="p-4 border rounded-lg space-y-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold">{brief.campaignName}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {brief.category}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {brief.platform?.[0] || "N/A"}
                        </Badge>
                        <Badge
                          variant={
                            brief.status === "PENDING"
                              ? "warning"
                              : brief.status === "ACTIVE"
                                ? "success"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {brief.status}
                        </Badge>
                      </div>
                    </div>
                    <Badge
                      variant="success"
                      className="flex items-center gap-1"
                    >
                      <DollarSign className="h-3 w-3" />
                      {brief.priceCreator}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-xs">
                        {brief.activeCreators} / {getBriefCreators(brief)}{" "}
                        creators
                        {isAvailable(brief) && (
                          <Badge
                            variant="outline"
                            className="ml-2 text-xs bg-green-50 text-green-700"
                          >
                            Available
                          </Badge>
                        )}
                      </span>
                    </div>
                    <Progress
                      value={
                        (brief.activeCreators / getBriefCreators(brief)) * 100
                      }
                      variant={
                        getProgressVariant(brief) as
                          | "default"
                          | "destructive"
                          | "warning"
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Price: {brief.price} DT</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
