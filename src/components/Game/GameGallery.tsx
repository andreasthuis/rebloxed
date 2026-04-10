import { useState, useRef, useEffect, useCallback } from "react";
import GameModal from "./GameModal";
import { ThumbsUp, Users } from "lucide-react";

type Game = {
  id: number;
  name: string;
  thumbnail?: string;
  playerCount: number;
  [key: string]: any;
};

interface GameGalleryProps {
  title: string;
  games: Game[];
}

const ITEMS_PER_PAGE = 12;

const GameGallery = ({ title, games }: GameGalleryProps) => {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    if (visibleCount < games.length) {
      setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
    }
  }, [visibleCount, games.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 1.0 },
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore]);

  const visibleGames = games.slice(0, visibleCount);

  return (
    <div className="gallery-section">
      <h1>{title}</h1>

      <div className="game-grid">
        {visibleGames.map((game) => (
          <div
            className="card"
            key={game.id}
            onClick={() => setSelectedGame(game)}
          >
            <img src={game.thumbnail} alt={game.name} />
            <p>{game.name}</p>
            <div className="sub-info">
                  <p className="like-ratio">
                    <ThumbsUp size={16} />
                    {Math.round(
                      (game.totalUpVotes /
                        (game.totalUpVotes + game.totalDownVotes)) *
                        100,
                    )}
                    %
                  </p>

                  <p className="player-count">
                    <Users size={16} />
                    {new Intl.NumberFormat("en-US", {
                      notation: "compact",
                      compactDisplay: "short",
                      maximumFractionDigits: 1,
                    }).format(game.playerCount)}
                  </p>
                </div>
          </div>
        ))}
      </div>

      {visibleCount < games.length && (
        <div ref={loaderRef} className="loader">
          <p>Loading more games...</p>
        </div>
      )}

      {selectedGame && (
        <GameModal game_id={selectedGame.universeId} onClose={() => setSelectedGame(null)} />
      )}
    </div>
  );
};

export default GameGallery;
