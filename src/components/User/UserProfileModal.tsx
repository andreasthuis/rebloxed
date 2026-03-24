import UserProfileDetails from "./UserProfileDetails";
import { invoke } from "@tauri-apps/api/core";
import failedPfp from "../../assets/FailedPfp.webp";
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
  description?: string
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
    try {
      const [thumbRes, presenceRes, namesRes] = await Promise.all([
        invoke<string>("roblox_request", {
          method: "GET",
          url: `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${id}&size=150x150&format=Png&isCircular=true`,
        }),
        invoke<string>("roblox_request", {
          method: "POST",
          url: `https://presence.roblox.com/v1/presence/users`,
          body: JSON.stringify({ userIds: [id] }),
        }),
        invoke<string>("roblox_request", {
          method: "GET",
          url: `https://users.roblox.com/v1/users/${id}`,
        }),
      ]);

      const { data: thumbData } = JSON.parse(thumbRes);
      const { userPresences } = JSON.parse(presenceRes);
      const namesData = JSON.parse(namesRes);

      const nameInfo = namesData;
      const thumb = thumbData?.[0];
      const presence = userPresences?.[0];
      const pType = presence?.userPresenceType ?? 0;

      return {
        id,
        displayName: nameInfo?.displayName ?? "Unknown Player",
        username: nameInfo?.name ?? "Unknown",
        avatarUrl: thumb?.imageUrl ?? failedPfp,
        presenceType: pType,
        isOnline: pType > 0,
        presence:
          pType === 2
            ? "In Game"
            : pType === 3
            ? "In Studio"
            : pType === 1
            ? "Online"
            : "Offline",
        gameId: presence?.id ?? null,
        presenceData: presence,
        created: nameInfo.created,
        description: nameInfo.description,
      };
    } catch (err) {
      console.error("Failed to fetch full user:", err);
      return null;
    }
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