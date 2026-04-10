import GroupDetails from "./GroupDetails";
import { useBlur } from "../misc/BlurContext";
import { useEffect } from "react";
import { createPortal } from "react-dom";

interface GroupModalProps {
  group: any;
  onClose: () => void;
}

const GroupModal = ({ group, onClose }: GroupModalProps) => {
  const { acquire, release } = useBlur();

  useEffect(() => {
    acquire();
    return () => release();
  }, [acquire, release]);

  if (!group) return null;

  const modalUI = (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="modal-close"
          onClick={onClose}
          aria-label="Close group details"
        >
          ✕
        </button>
        <GroupDetails group={group} />
      </div>
    </div>
  );

  return createPortal(modalUI, document.body);
};

export default GroupModal;