import GameDetails from "./GameDetails";

interface GameModalProps {
  game: any;
  onClose: () => void;
}

const GameModal = ({ game, onClose }: GameModalProps) => {
  if (!game) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <GameDetails game={game} />
      </div>
    </div>
  );
};

export default GameModal;