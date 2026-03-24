import GameDetails from "./GameDetails";
import { useBlur } from "../misc/BlurContext";
import { useEffect } from "react";

interface GameModalProps {
  game: any;
  onClose: () => void;
}

const GameModal = ({ game, onClose }: GameModalProps) => {
  if (!game) return null;

  const { acquire, release } = useBlur();

  useEffect(() => {
    acquire();
    return release;
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <GameDetails game={game} />
      </div>
    </div>
  );
};

export default GameModal;
