import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import GameGallery from "../Game/GameGallery";
import { Game } from "../../types";

// Matches the SortEntry struct from our Rust code
interface SortEntry {
  sortDisplayName: string | null;
  games: Game[];
}

const SearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SortEntry[]>([]);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const [sorts, nextToken] = await invoke<[SortEntry[], string | null]>(
        "search_game", 
        { name: searchQuery, pageToken: null }
      );

      setResults(sorts);
      setPageToken(nextToken);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="search-page-container dashboard-content">
      {/* Search Header */}
      <div className="search-header">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search for games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" disabled={isSearching} className="search-button">
            {isSearching ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      <hr className="section-divider" />

      {/* Results Layout */}
      <div className="search-results">
        {results.length > 0 ? (
          results.map((sort, index) => (
            <div key={index} className="search-category-section">
              {sort.games.length > 0 && (
                <GameGallery 
                  title={sort.sortDisplayName || "Search Results"} 
                  games={sort.games} 
                />
              )}
            </div>
          ))
        ) : (
          !isSearching && searchQuery && (
            <div className="no-results">No games found for "{searchQuery}"</div>
          )
        )}
      </div>

      {/* Load More (Optional) */}
      {pageToken && (
        <button 
          className="load-more-btn" 
          onClick={() => {/* logic to append next page results */}}
        >
          Show More Results
        </button>
      )}
    </div>
  );
};

export default SearchPage;