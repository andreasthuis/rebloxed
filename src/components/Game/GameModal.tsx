import GameDetails from "./GameDetails";
import { useBlur } from "../misc/BlurContext";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom"; // Import the Portal tool
import { invoke } from "@tauri-apps/api/core";

interface GameModalProps {
  game_id: number;
  onClose: () => void;
}

const GameModal = ({ game_id, onClose }: GameModalProps) => {
  const [game, setGame] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { acquire, release } = useBlur();

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const fetchGame = async () => {
      try {
        const [gameData, thumbnail] = await invoke<[any, string | null]>(
          "get_game_details",
          {
            id: game_id,
            getThumbnail: true,
          },
        );

        if (!cancelled) {
          setGame({
            ...gameData,
            thumbnail: thumbnail,
          });
        }
      } catch (err) {
        console.error("Failed to fetch game details:", err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchGame();

    return () => {
      cancelled = true;
    };
  }, [game_id]);

  useEffect(() => {
    acquire();
    return () => release();
  }, [acquire, release]);

  if (!game_id) return null;

  const modalUI = (
    <div
      className="modal-overlay"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      {isLoading ? (
        <div className="loading-spinner" />
      ) : (
        <div 
          className="modal-content" 
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close game details"
          >
            ✕
          </button>

          {game && <GameDetails game={game} />}
        </div>
      )}
    </div>
  );

  return createPortal(modalUI, document.body);
};

export default GameModal;