import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect, useCallback, useRef } from "react";
import GameCarousel from "../Game/GameCarousel";
import { Game } from "../../types";
import CustomDropdown from "../misc/Dropdown";

export interface FilterGroup {
  filterDisplayName: string;
  filterType: string;
  filterOptions: any[];
}

export interface SortEntry {
  contentType: string;
  sortDisplayName?: string;
  displayName?: string;
  filters?: FilterGroup[];
  games: Game[];
}

const DEFAULT_HARDWARE = {
  device: "all",
  country: "all",
  cpu: "8",
  ram: "16GB",
  res: "1920x1080",
  net: "wifi",
};

const Discovery = () => {
  const [sorts, setSorts] = useState<SortEntry[]>([]);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterGroup[]>([]);
  const [currentFilter, setCurrentFilter] = useState(DEFAULT_HARDWARE);

  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchDiscovery = useCallback(
    async (token: string | null = null) => {
      if (loading) return;

      setLoading(true);
      try {
        const [newSorts, nextToken, extractedFilters] = await invoke<
          [SortEntry[], string | null, FilterGroup[]]
        >("get_discovery_sorts", {
          ...currentFilter,
          pageToken: token,
        });

        setSorts((prev) => (token ? [...prev, ...newSorts] : newSorts));
        setPageToken(nextToken);

        if (extractedFilters && filters.length === 0) {
          setFilters(extractedFilters);
        }
      } catch (error) {
        console.error("Failed to fetch discovery:", error);
      } finally {
        setLoading(false);
      }
    },
    [currentFilter, loading, filters.length]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pageToken && !loading) {
          fetchDiscovery(pageToken);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [pageToken, loading, fetchDiscovery]);

  useEffect(() => {
    setSorts([]);
    setPageToken(null);
    fetchDiscovery(null);
  }, [currentFilter]);

  const handleFilterClick = (filterType: string, optionId: string) => {
    setCurrentFilter((prev) => ({
      ...prev,
      [filterType]: optionId,
    }));
  };

  if (loading && sorts.length === 0) {
    return (
      <div className="initial-load" style={{ textAlign: "center", padding: "50px" }}>
        <div className="loading-spinner" />
        <div className="loading-text">Loading the game charts...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-content" style={{ padding: "20px" }}>
      {sorts.map((sort, index) => {
        if (sort.contentType === "Filters" && filters.length > 0) {
          return (
            <div 
              key="filter-row" 
              className="filter-row"
            >
              {filters.map((group) => (
                <CustomDropdown
                  key={group.filterType}
                  label={group.filterDisplayName}
                  options={group.filterOptions}
                  value={currentFilter[group.filterType as keyof typeof DEFAULT_HARDWARE]}
                  onChange={(newVal: string) => handleFilterClick(group.filterType, newVal)}
                />
              ))}
            </div>
          );
        }

        return (
          <GameCarousel
            key={sort.displayName || sort.sortDisplayName || index}
            games={sort.games}
            title={sort.sortDisplayName || sort.displayName || "Recommended"}
          />
        );
      })}

      <div 
        ref={observerTarget} 
        className="scroll-sentinel loader" 
      >
        {loading && <p >Loading more categories...</p>}
        {!pageToken && sorts.length > 0 && (
          <p>End of discovery</p>
        )}
      </div>
    </div>
  );
};

export default Discovery;