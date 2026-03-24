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
  const [maxIndex, setMaxIndex] = useState(0);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const startX = useRef<number | null>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault(); // stop page scrolling

    const direction =
      Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

    if (direction > 0) {
      next();
    } else {
      prev();
    }
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

  const handleTouchEnd = () => {
    startX.current = null;
  };

  const cardWidth = 160;
  const gap = 26;
  const step = cardWidth + gap;

  useEffect(() => {
    const calculateMax = () => {
      if (viewportRef.current) {
        const viewportWidth = viewportRef.current.clientWidth;
        const totalContentWidth =
          games.length * cardWidth + (games.length - 1) * gap;
        const maxScrollPx = Math.max(0, totalContentWidth - viewportWidth);
        setMaxIndex(Math.ceil(maxScrollPx / step));
      }
    };

    calculateMax();
    window.addEventListener("resize", calculateMax);
    return () => window.removeEventListener("resize", calculateMax);
  }, [games.length]);

  const next = () => setIndex((prev) => Math.min(prev + 1, maxIndex));
  const prev = () => setIndex((prev) => Math.max(prev - 1, 0));

  return (
    <div className="carousel-section">
      <h1>{title}</h1>
      <div className="carousel">
        <div
          className="viewport"
          ref={viewportRef}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="track"
            style={{ transform: `translateX(-${index * step}px)` }}
          >
            {games.map((game) => (
              <div
                className="card"
                key={game.id}
                onClick={() => setSelectedGame(game)}
              >
                <img src={game.thumbnail} alt={game.name} />
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
