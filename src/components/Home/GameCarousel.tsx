import { useState, useRef, useEffect } from "react";
import GameModal from "../Game/GameModal";

type Game = {
  id: number;
  name: string;
  thumbnail?: string;
};

interface GameCarouselProps {
  title: string;
  games: Game[];
}

const GameCarousel = ({ title, games }: GameCarouselProps) => {
  const [index, setIndex] = useState(0);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);

  const cardWidth = 160;
  const gap = 26;
  const step = cardWidth + gap;
  const buffer = 3;

  const next = () => setIndex((prev) => Math.min(prev + 1, games.length - 1));
  const prev = () => setIndex((prev) => Math.max(prev - 1, 0));

  const [visibleCount, setVisibleCount] = useState(0);
  useEffect(() => {
    const updateVisibleCount = () => {
      const width = viewportRef.current?.clientWidth || 1000;
      setVisibleCount(Math.ceil(width / step));
    };
    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, [step]);

  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.preventDefault();
    if (Math.abs(e.deltaY) < 10 && Math.abs(e.deltaX) < 10) return;

    if (e.deltaY > 0 || e.deltaX > 0) next();
    else prev();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const diff = startX.current - e.touches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
      startX.current = null;
    }
  };

  const start = Math.max(0, index - buffer);
  const end = Math.min(games.length, index + visibleCount + buffer);
  const visibleGames = games.slice(start, end);

  return (
    <div className="carousel-section">
      <h1>{title}</h1>

      <div className="carousel">
        <div
          className="viewport"
          ref={viewportRef}
          style={{ overflow: "hidden", width: "100%" }}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => (startX.current = null)}
        >
          <div
            className="track"
            style={{
              display: "flex",
              gap: `${gap}px`,
              transform: `translateX(-${index * step}px)`,
              paddingLeft: `${start * step}px`,
              transition: "transform 0.4s ease-out",
              width: "max-content",
            }}
          >
            {visibleGames.map((game) => (
              <div
                className="card"
                key={game.id}
                onClick={() => setSelectedGame(game)}
                style={{ width: cardWidth, flexShrink: 0 }}
              >
                <img
                  src={game.thumbnail}
                  alt={game.name}
                  style={{ width: "100%" }}
                />
                <p>{game.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedGame && (
        <GameModal game={selectedGame} onClose={() => setSelectedGame(null)} />
      )}
    </div>
  );
};

export default GameCarousel;
