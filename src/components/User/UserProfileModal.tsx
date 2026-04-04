import UserProfileDetails from "./UserProfileDetails";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { useBlur } from "../misc/BlurContext";

interface User {
  id: number;
  displayName: string;
  username: string;
  avatarUrl: string;
  presenceType: number;
  isOnline: boolean;
  presence: string;
  gameId: string | null;
  presenceData: any;
  created: string;
  description?: string;
}

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
    const userData = await invoke<User>("get_user", { id });
    return userData;
  };

  useEffect(() => {
    let cancelled = false;

    // If full user object provided → use it directly
    if (typeof prop === "object") {
      setUser(prop);
      console.log("Using provided user object:", prop);
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
        <div className="loading-spinner">Loading...</div>
      ) : (
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
};

export default UserProfileModal;
