import { useEffect, useState } from "react";
import { fetch } from "@tauri-apps/plugin-http";
import GameCarousel from "./components/GameCarousel";
import FriendsCarousel from "./components/FriendsCarousel";
import "./App.css";
import Topbar from "./components/Topbar";
import Welcome from "./components/greet/Welcome";
import { getItem } from "tauri-plugin-keychain";

import failedPfp from "./assets/FailedPfp.webp";

interface Friend {
  id: number;
  displayName: string;
  username: string;
  avatarUrl: string;
  presenceType: number;
  isOnline: boolean;
  presence: string;
  placeId: number | null;
  gameId: string | null;
}

export interface Game {
  id: number;
  name: string;
  thumbnail?: string;
  playing: number;
  [key: string]: any; // Allows for other properties from the Roblox API
}



function App() {
  const [userId, setUserId] = useState<number | null>(() => {
    const saved = localStorage.getItem("roblox_user_id");
    return saved ? parseInt(saved) : null;
  });
  const [favorites, setFavorites] = useState<Game[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleLogin = (id: number) => {
    localStorage.setItem("roblox_user_id", id.toString());
    setUserId(id);
  };

  const fetchFavorites = async () => {
    try {
      const res = await fetch(
        `https://games.roblox.com/v2/users/${userId}/favorite/games?accessFilter=2&limit=10&sortOrder=Desc`,
      );
      const { data: gamesData } = await res.json();
      const universeIds = gamesData.map((g: any) => g.id).join(",");

      const [detailsRes, thumbRes] = await Promise.all([
        fetch(`https://games.roblox.com/v1/games?universeIds=${universeIds}`),
        fetch(
          `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeIds}&size=256x256&format=Png&isCircular=false`,
        ),
      ]);

      const { data: detailsData } = await detailsRes.json();
      const { data: thumbData } = await thumbRes.json();

      console.log(detailsData)

      const finalGames: Game[] = gamesData.map((g: any) => ({
        ...g,
        thumbnail: thumbData.find((t: any) => t.targetId === g.id)?.imageUrl,
        playing: detailsData.find((d: any) => d.id === g.id)?.playing || 0,
        ...detailsData.find((d: any) => d.id === g.id),
      }));

      setFavorites(finalGames);
    } catch (err) {
      console.error("Games API Error:", err);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await fetch(
        `https://friends.roblox.com/v1/users/${userId}/friends`,
      );
      const { data: friendsData } = await res.json();

      const validFriendIds = friendsData
        .filter((f: any) => f.id > 0)
        .map((f: any) => f.id);

      if (validFriendIds.length === 0) {
        setFriends([]);
        return;
      }

      const [thumbRes, presenceRes, namesRes] = await Promise.all([
        fetch(
          `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${validFriendIds.join(
            ",",
          )}&size=150x150&format=Png&isCircular=true`,
        ),
        fetch(`https://presence.roblox.com/v1/presence/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: validFriendIds }),
        }),
        fetch(`https://users.roblox.com/v1/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userIds: validFriendIds,
            excludeBannedUsers: true,
          }),
        }),
      ]);

      const { data: thumbData } = await thumbRes.json();
      const { userPresences } = await presenceRes.json();
      const { data: namesData } = await namesRes.json();

      const finalFriends: Friend[] = validFriendIds
        .map((id: number): Friend => {
          const originalFriendData = friendsData.find((f: any) => f.id === id);
          const nameInfo = namesData?.find((n: any) => n.id === id);
          const thumb = thumbData?.find((t: any) => t.targetId === id);
          const presence = userPresences?.find((p: any) => p.userId === id);

          const pType = presence?.userPresenceType ?? 0;

          const finalDisplayName =
            nameInfo?.displayName ||
            nameInfo?.name ||
            originalFriendData?.displayName ||
            "Unknown Player";
          const finalUsername =
            nameInfo?.name || originalFriendData?.name || "Unknown";

          return {
            id,
            displayName: finalDisplayName,
            username: finalUsername,
            avatarUrl: thumb?.imageUrl || failedPfp,
            presenceType: pType,
            isOnline: pType > 0,
            presence:
              (pType === 2
                ? "In Game"
                : pType === 3
                  ? "In Studio"
                  : pType === 1
                    ? "Online"
                    : "Offline"),
            placeId: presence?.placeId || null,
            gameId: presence?.gameId || null,
          };
        })
        .filter((friend: Friend) => friend.username !== "Unknown")

        .sort((a: Friend, b: Friend) => {
          const getPriority = (type: number) => {
            if (type === 2) return 3; // Playing
            if (type === 1) return 2; // Online
            if (type === 3) return 1; // Studio
            return 0; // Offline
          };
          return getPriority(b.presenceType) - getPriority(a.presenceType);
        });

      console.log("Full Friends List (including offline):", finalFriends, namesData, thumbData, userPresences);
      setFriends(finalFriends);
    } catch (err) {
      console.error("Failed to fetch friends metadata:", err);
    }
  };

  const loadCookie = async () => {
    try {
      const cookie = await getItem("roblosecurity");

      if (cookie) {
        console.log("Logged in with stored cookie");
        console.log("Raw cookie string:", cookie);

        const match = cookie.match(/\.ROBLOSECURITY=([^;]+)/);
        if (match) {
          const cookieValue = match[1];
          console.log("Cookie value:", cookieValue);
        }
      }
    } catch (err) {
      console.error("Failed to load cookie:", err);
    }
  };

  loadCookie();

  useEffect(() => {
    if (userId) {
      setIsLoading(true);
      Promise.all([fetchFavorites(), fetchFriends()])
        .finally(() => setIsLoading(false));
    }
  }, [userId]);

  if (!userId) {
    return <Welcome onLogin={handleLogin} />;
  }

  return (
    <div className="container">
      <Topbar />
      {isLoading ? (
        <div className="loading-spinner">Loading your data...</div>
      ) : (
        <>
          <FriendsCarousel title="Friends" friends={friends} />
          <hr className="section-divider" />
          <GameCarousel title="Favorite Games" games={favorites} />
        </>
      )}
    </div>
  );
}

export default App;
