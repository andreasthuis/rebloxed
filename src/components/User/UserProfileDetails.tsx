import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import failedPfp from "../../assets/FailedPfp.webp";
import { User } from "../../types";

interface Props {
  user: User;
}

export default function UserProfileDetails({ user }: Props) {
  const [activeTab, setActiveTab] = useState<"about" | "friends">("about");
  const abortRef = useRef(false);

  const launchRoblox = async (placeId?: number, serverId?: string) => {
    if (!placeId) return;
    try {
      await invoke("launch_roblox", {
        place_id: String(placeId),
        serverId: serverId ?? null,
      });
    } catch (err) {
      console.error("Launch error:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "friends") {
      return;
    };
    return () => {
      abortRef.current = true;
    };
  }, [activeTab]);

  return (
    <div className="user-profile-details">
      <div className="details-header">
        <div className="avatar-container">
          <img
            src={user.avatarUrl || failedPfp}
            alt={user.displayName}
            className="details-avatar"
          />
          {user.isOnline && <span className="status-badge online" />}
        </div>

        <div className="details-info">
          <h1>{user.displayName}</h1>
          <p className="username">@{user.username}</p>

          <p className="presence-text">
            {user.presenceData?.lastLocation ?? user.presence ?? "Offline"}
          </p>

          <div className="action-buttons">
            <button className="primary-btn">Message</button>

            {user.presenceType === 2 && (
              <button
                className="primary-btn join-btn"
                onClick={() =>
                  launchRoblox(
                    user.presenceData?.placeId,
                    user.presenceData?.gameId,
                  )
                }
              >
                Join
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="tab-container">
        <button
          className={`tab-btn ${activeTab === "about" ? "active" : ""}`}
          onClick={() => setActiveTab("about")}
        >
          About
        </button>

        <button
          className={`tab-btn ${activeTab === "friends" ? "active" : ""}`}
          onClick={() => setActiveTab("friends")}
        >
          Friends
        </button>
      </div>

      <div className="details-body">
        {activeTab === "about" ? (
          <div className="about-section">
            <div className="stats-row">
              <div className="stat">
                <strong>Joined</strong>
                <p>
                  {user.created
                    ? new Date(user.created).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>

            <h3>Bio</h3>
            <p className="user-bio description">{user.description || "No bio provided."}</p>
          </div>
        ) : (
          <div className="friends-list-tab">
            <p className="coming-soon">Friends list coming soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
