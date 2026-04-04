import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import failedPfp from "../../assets/FailedPfp.webp";

interface User {
  id: number;
  displayName: string;
  username: string;
  avatarUrl?: string;
  isOnline: boolean;
  presence?: string;
  description?: string;
  created?: string;
  presenceType?: number;
  presenceData?: any;
}

interface Props {
  user: User;
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const presenceLabel = (type: number = 0) =>
  ["Offline", "Online", "In Game", "In Studio"][type] ?? "Offline";

const chunk = <T,>(arr: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );

export default function UserProfileDetails({ user }: Props) {
  const [activeTab, setActiveTab] = useState<"about" | "friends">("about");
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [friends, setFriends] = useState<User[]>([]);
  const fetchedRef = useRef(false);
  const abortRef = useRef(false);

  const fetchFriends = async () => {
    if (loadingFriends || fetchedRef.current) return;

    setLoadingFriends(true);
    abortRef.current = false;

    try {
      const friendsRes = await invoke<string>("roblox_request", {
        method: "GET",
        url: `https://friends.roblox.com/v1/users/${user.id}/friends`,
      });

      if (abortRef.current) return;

      const ids: number[] =
        JSON.parse(friendsRes)
          .data?.map((f: any) => f.id)
          ?.filter((id: number) => id > 0) ?? [];

      if (!ids.length) {
        setFriends([]);
        fetchedRef.current = true;
        return;
      }

      const presencePromise = invoke<string>("roblox_request", {
        method: "POST",
        url: "https://presence.roblox.com/v1/presence/users",
        body: JSON.stringify({ userIds: ids }),
      });

      const detailBatches = chunk(ids, 100);
      const thumbBatches = chunk(ids, 50);

      const allDetails: any[] = [];
      const allThumbs: any[] = [];

      for (let i = 0; i < detailBatches.length; i++) {
        const res = await invoke<string>("roblox_request", {
          method: "POST",
          url: "https://users.roblox.com/v1/users",
          body: JSON.stringify({
            userIds: detailBatches[i],
            excludeBannedUsers: true,
          }),
        });

        if (abortRef.current) return;
        allDetails.push(...(JSON.parse(res).data ?? []));

        if (i < detailBatches.length - 1) await delay(200);
      }

      for (let i = 0; i < thumbBatches.length; i++) {
        const res = await invoke<string>("roblox_request", {
          method: "GET",
          url: `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${thumbBatches[i].join(",")}&size=150x150&format=Png&isCircular=true`,
        });

        if (abortRef.current) return;
        allThumbs.push(...(JSON.parse(res).data ?? []));

        if (i < thumbBatches.length - 1) await delay(200);
      }

      const presenceRes = await presencePromise;
      if (abortRef.current) return;

      const presences = JSON.parse(presenceRes).userPresences ?? [];

      const presenceMap = new Map(presences.map((p: any) => [p.userId, p]));

      const thumbMap = new Map(
        allThumbs.map((t: any) => [t.targetId, t.imageUrl]),
      );

      const finalFriends: User[] = allDetails.map((u: any) => {
        const presence = presenceMap.get(u.id) as { userPresenceType: number };
        const pType = presence?.userPresenceType ?? 0;

        return {
          id: u.id,
          displayName: u.displayName || u.name,
          username: u.name,
          avatarUrl: thumbMap.get(u.id) || failedPfp,
          presenceType: pType,
          isOnline: pType > 0,
          presence: presenceLabel(pType),
          presenceData: presence,
          description: u.description,
          created: u.created,
        };
      });

      setFriends(finalFriends);
      fetchedRef.current = true;
    } catch (err) {
      console.error("Friends fetch failed:", err);
    } finally {
      if (!abortRef.current) setLoadingFriends(false);
    }
  };

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
    if (activeTab === "friends") fetchFriends();
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
          Friends {friends.length > 0 && `(${friends.length})`}
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
            <p className="user-bio">{user.description || "No bio provided."}</p>
          </div>
        ) : (
          <div className="friends-list-tab">
            {loadingFriends ? (
              <div className="loader">Fetching friends…</div>
            ) : friends.length ? (
              <div className="friends-grid">
                {friends.map((friend) => (
                  <div key={friend.id} className="friend-card-2">
                    <div className="friend-avatar-wrapper-2">
                      <img
                        src={friend.avatarUrl || failedPfp}
                        alt={friend.username}
                      />
                      {friend.isOnline && (
                        <span
                          className={`mini-status p-${friend.presenceType}`}
                        />
                      )}
                    </div>

                    <div className="friend-info">
                      <span className="f-display">{friend.displayName}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No friends found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
