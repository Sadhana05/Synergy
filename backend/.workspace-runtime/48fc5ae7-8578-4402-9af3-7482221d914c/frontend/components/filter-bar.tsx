"use client"

import { useState } from "react"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FilterBarProps {
  onSearch?: (query: string) => void
  onFilterChange?: (filter: string) => void
  filters?: string[]
  activeFilter?: string
}

const defaultFilters = ["All", "New", "Trending", "Top Volume", "Top Gainers"]

export function FilterBar({
  onSearch,
  onFilterChange,
  filters = defaultFilters,
  activeFilter = "All",
}: FilterBarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState(activeFilter)

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  const handleFilterClick = (filter: string) => {
    setSelectedFilter(filter)
    onFilterChange?.(filter)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <Input
            type="text"
            placeholder="Search tokens..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 h-11 bg-[#1A1A1A] border-[#9CFFBB]/20 text-white placeholder:text-gray-600"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          className="border-[#9CFFBB]/20 text-gray-400 hover:text-white hover:bg-[#9CFFBB]/10 bg-transparent"
        >
          <SlidersHorizontal size={18} className="mr-2" />
          Filters
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => handleFilterClick(filter)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              selectedFilter === filter
                ? "bg-[#9CFFBB]/20 text-[#9CFFBB] border border-[#9CFFBB]/30"
                : "bg-[#1A1A1A] text-gray-400 border border-transparent hover:border-[#9CFFBB]/20 hover:text-white",
            )}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  )
}
