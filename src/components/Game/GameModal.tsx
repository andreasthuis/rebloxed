import GameDetails from "./GameDetails";
import { useBlur } from "../misc/BlurContext";
import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
interface GameModalProps {
  game_id: number;
  onClose: () => void;
}

const GameModal = ({ game_id, onClose }: GameModalProps) => {
  if (!game_id) return null;

  const [game, setGame] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const { acquire, release } = useBlur();

  useEffect(() => {
    acquire();
    return release;
  }, []);

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      {isLoading ? (
        <div className="loading-spinner" />
      ) : (
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close profile"
          >
            ✕
          </button>

          {game && <GameDetails game={game} />}
        </div>
      )}
    </div>
  );
};

export default GameModal;
