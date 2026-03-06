"use client";

import { useState, useMemo } from "react";
import { BriefsList, type BriefsFilter } from "@/components/BriefsList";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter, X } from "lucide-react";

export default function BriefsPage() {
  const [statusFilter, setStatusFilter] = useState<BriefsFilter["status"]>("ALL");
  const [platformFilter, setPlatformFilter] = useState<BriefsFilter["platform"]>("ALL");
  const [availabilityFilter, setAvailabilityFilter] = useState<BriefsFilter["availability"]>("ALL");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showFilters, setShowFilters] = useState(true);

  const filter: BriefsFilter = useMemo(
    () => ({
      status: statusFilter,
      platform: platformFilter,
      availability: availabilityFilter,
      category: categoryFilter,
    }),
    [statusFilter, platformFilter, availabilityFilter, categoryFilter]
  );

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
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
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
                  onChange={(e) => setStatusFilter(e.target.value as BriefsFilter["status"])}
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
                  onChange={(e) => setPlatformFilter(e.target.value as BriefsFilter["platform"])}
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
                  onChange={(e) => setAvailabilityFilter(e.target.value as BriefsFilter["availability"])}
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

      <BriefsList filter={filter} />
    </div>
  );
}
