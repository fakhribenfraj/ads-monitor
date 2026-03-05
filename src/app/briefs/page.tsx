"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  RefreshCw, 
  DollarSign, 
  LayoutGrid, 
  Filter,
  X
} from "lucide-react";
import type { Brief } from "@/types";
import { findBriefWithRetry, getAuthToken } from "@/services/api";

type StatusFilter = "ALL" | "PENDING" | "ACTIVE" | "COMPLETED";
type PlatformFilter = "ALL" | "tiktok" | "instagram";
type AvailabilityFilter = "ALL" | "available" | "full";

export default function BriefsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("ALL");
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showFilters, setShowFilters] = useState(true);

  const {
    data: briefsData,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["briefs"],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) return [];
      const response = await findBriefWithRetry({
        brief: "public",
        typePosting: "posting",
        status: "PENDING",
        platform: ["tiktok", "instagram"],
      });
      return response.response || [];
    },
    enabled: !!getAuthToken(),
    refetchInterval: 30000,
  });

  const getBriefCreators = (brief: Brief) =>
    Math.ceil(brief.numberCreators + brief.numberCreators / 2);

  const isAvailable = (brief: Brief) => {
    const threshold = getBriefCreators(brief);
    return brief.activeCreators < threshold;
  };

  const filteredBriefs = (briefsData || []).filter((brief: Brief) => {
    if (statusFilter !== "ALL" && brief.status !== statusFilter) return false;
    if (platformFilter !== "ALL" && brief.platform?.[0] !== platformFilter) return false;
    if (availabilityFilter === "available" && !isAvailable(brief)) return false;
    if (availabilityFilter === "full" && isAvailable(brief)) return false;
    if (categoryFilter && !brief.category.toLowerCase().includes(categoryFilter.toLowerCase())) return false;
    return true;
  });

  const getProgressVariant = (brief: Brief) => {
    const percentage = (brief.activeCreators / getBriefCreators(brief)) * 100;
    if (percentage >= 75) return "destructive";
    if (percentage >= 50) return "warning";
    return "default";
  };

  const clearFilters = () => {
    setStatusFilter("ALL");
    setPlatformFilter("ALL");
    setAvailabilityFilter("ALL");
    setCategoryFilter("");
  };

  const hasActiveFilters = 
    statusFilter !== "ALL" || 
    platformFilter !== "ALL" || 
    availabilityFilter !== "ALL" || 
    categoryFilter !== "";

  const availableCount = (briefsData || []).filter(isAvailable).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Briefs</h1>
      </div>

      <div className="flex items-center gap-4">
        <Button 
          variant={showFilters ? "default" : "outline"} 
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1">
              Active
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
        <span className="text-sm text-muted-foreground ml-auto">
          {availableCount} of {briefsData?.length || 0} available
        </span>
      </div>

      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Filter Briefs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <select
                  id="platform"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value as PlatformFilter)}
                >
                  <option value="ALL">All Platforms</option>
                  <option value="tiktok">TikTok</option>
                  <option value="instagram">Instagram</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability">Availability</Label>
                <select
                  id="availability"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value as AvailabilityFilter)}
                >
                  <option value="ALL">All</option>
                  <option value="available">Available</option>
                  <option value="full">Full</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="Search category..."
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Briefs List
              </CardTitle>
              <CardDescription>
                {filteredBriefs.length} brief{filteredBriefs.length !== 1 ? "s" : ""} found
                {hasActiveFilters && ` (filtered from ${briefsData?.length || 0})`}
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
              {hasActiveFilters && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {filteredBriefs.map((brief: Brief) => (
                  <div
                    key={brief._id}
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
                            variant={brief.status === "PENDING" ? "warning" : brief.status === "ACTIVE" ? "success" : "secondary"}
                            className="text-xs"
                          >
                            {brief.status}
                          </Badge>
                        </div>
                      </div>
                      <Badge variant="success" className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {brief.priceCreator}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-xs">
                          {brief.activeCreators} / {getBriefCreators(brief)} creators
                          {isAvailable(brief) && (
                            <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700">
                              Available
                            </Badge>
                          )}
                        </span>
                      </div>
                      <Progress 
                        value={(brief.activeCreators / getBriefCreators(brief)) * 100} 
                        variant={getProgressVariant(brief) as "default" | "destructive" | "warning"}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Brand: {brief.idBrand?.firstName || "N/A"}</span>
                      <span>Price: {brief.price} DT</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
