import GroupDetails from "./GroupDetails";
import { useBlur } from "../misc/BlurContext";
import { useEffect } from "react";

interface GroupModalProps {
  group: any;
  onClose: () => void;
}

const GameModal = ({ group, onClose }: GroupModalProps) => {
  if (!group) return null;

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
        <GroupDetails group={group} />
      </div>
    </div>
  );
};

export default GameModal;
