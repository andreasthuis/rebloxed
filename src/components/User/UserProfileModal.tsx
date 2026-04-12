import UserProfileDetails from "./UserProfileDetails";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useBlur } from "../misc/BlurContext";
import { User } from "../../types";
interface UserProfileModalProps {
  prop: number | User;
  onClose: () => void;
}

const UserProfileModal = ({ prop, onClose }: UserProfileModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const { acquire, release } = useBlur();

  if (!prop) return null;

  const fetchFullUser = async (id: number): Promise<User | null> => {
    try {
      const userData = await invoke<User>("get_user", { id });
      return userData;
    } catch (error) {
      console.error("Failed to fetch user:", error);
      return null;
    }
  };

  useEffect(() => {
    let cancelled = false;

    if (typeof prop === "object") {
      setUser(prop);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    fetchFullUser(prop)
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [prop]);

  useEffect(() => {
    acquire();
    return () => release();
  }, [acquire, release]);

  const modalJSX = (
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
            aria-label="Close profile"
          >
            ✕
          </button>

          {user && <UserProfileDetails user={user} />}
        </div>
      )}
    </div>
  );

  return createPortal(modalJSX, document.body);
};

export default UserProfileModal;