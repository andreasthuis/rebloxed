import { useEffect, useState } from "react";
import GameCarousel from "./components/Home/GameCarousel";
import FriendsCarousel from "./components/Home/FriendsCarousel";
import "./App.css";
import Topbar from "./components/Home/Topbar";
import Welcome from "./components/greet/Welcome";
import { invoke } from "@tauri-apps/api/core";
import { BlurProvider } from "./components/misc/BlurContext";

import failedPfp from "./assets/FailedPfp.webp";

interface Friend {
  id: number;
  displayName: string;
  username: string;
  avatarUrl: string;
  presenceType: number;
  isOnline: boolean;
  presence: string;
  gameId: string | null;
  presenceData: any;
  description: string;
  created: string;
  friends: boolean;
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
    if (localStorage.getItem("login_method") === "user_id") {
      const saved = localStorage.getItem("roblox_user_id");
      return saved ? parseInt(saved) : null;
    }
    return null;
  });

  useEffect(() => {
    if (localStorage.getItem("login_method") === "cookie") {
      invoke<any>("get_authenticated_user")
        .then((user) => {
          console.log("Logged in as:", user.name);
          setUserId(user.id);
        })
        .catch((err) => {
          console.error("Failed to get authenticated user:", err);
          setUserId(null);
        });
    }
  }, []);

  const [favorites, setFavorites] = useState<Game[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleLogin = (id: number) => {
    localStorage.setItem("roblox_user_id", id.toString());
    setUserId(id);
  };

  const fetchFavorites = async () => {
    try {
      const resString = await invoke<string>("roblox_request", {
        method: "GET",
        url: `https://games.roblox.com/v2/users/${userId}/favorite/games?accessFilter=2&limit=10&sortOrder=Desc`,
      });

      const { data: gamesData } = JSON.parse(resString);
      if (!gamesData || gamesData.length === 0) return;

      const universeIds = gamesData.map((g: any) => g.id).join(",");

      const [detailsRes, thumbRes] = await Promise.all([
        invoke<string>("roblox_request", {
          method: "GET",
          url: `https://games.roblox.com/v1/games?universeIds=${universeIds}`,
        }),
        invoke<string>("roblox_request", {
          method: "GET",
          url: `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeIds}&size=256x256&format=Png&isCircular=false`,
        }),
      ]);

      const { data: detailsData } = JSON.parse(detailsRes);
      const { data: thumbData } = JSON.parse(thumbRes);

      const finalGames: Game[] = gamesData.map((g: any) => ({
        ...g,
        thumbnail: thumbData.find((t: any) => t.targetId === g.id)?.imageUrl,
        playing: detailsData.find((d: any) => d.id === g.id)?.playing || 0,
        ...detailsData.find((d: any) => d.id === g.id),
      }));

      setFavorites(finalGames);
      console.log("Final Favorites List:", finalGames);
    } catch (err) {
      console.error("Games API Error:", err);
    }
  };

  const fetchFriends = async () => {
    try {
      const resString = await invoke<string>("roblox_request", {
        method: "GET",
        url: `https://friends.roblox.com/v1/users/${userId}/friends`,
      });
      const { data: friendsData } = JSON.parse(resString);

      const validFriendIds = friendsData
        .filter((f: any) => f.id > 0)
        .map((f: any) => f.id);

      if (validFriendIds.length === 0) {
        setFriends([]);
        return;
      }

      const [thumbRes, presenceRes] = await Promise.all([
        invoke<string>("roblox_request", {
          method: "GET",
          url: `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${validFriendIds.join(",")}&size=150x150&format=Png&isCircular=true`,
        }),
        invoke<string>("roblox_request", {
          method: "POST",
          url: `https://presence.roblox.com/v1/presence/users`,
          body: JSON.stringify({ userIds: validFriendIds }),
        }),
      ]);

      const namesRes = await Promise.all(
        validFriendIds.map((userId: number) =>
          invoke<string>("roblox_request", {
            method: "GET",
            url: `https://users.roblox.com/v1/users/${userId}`,
          }),
        ),
      );

      const { data: thumbData } = JSON.parse(thumbRes);
      const { userPresences } = JSON.parse(presenceRes);
      const namesData = namesRes.map((res: string) => JSON.parse(res));

      console.log("Fetched Friends Data:", {
        friendsData,
        thumbData,
        userPresences,
        namesData,
      });

      const finalFriends: Friend[] = validFriendIds
        .map((id: number): Friend => {
          const originalFriendData = friendsData.find((f: any) => f.id === id);
          const nameInfo = namesData?.find((n: any) => n.id === id);
          const thumb = thumbData?.find((t: any) => t.targetId === id);
          const presence = userPresences?.find((p: any) => p.userId === id);
          const pType = presence?.userPresenceType ?? 0;

          return {
            id,
            displayName:
              nameInfo?.displayName ||
              originalFriendData?.displayName ||
              "Unknown Player",
            username: nameInfo?.name || originalFriendData?.name || "Unknown",
            avatarUrl: thumb?.imageUrl || failedPfp,
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
            gameId: presence?.id || null,
            presenceData: presence,
            description: nameInfo.description,
            created: nameInfo.created,
            friends: true,
          };
        })
        .filter((friend: Friend) => friend.username !== "Unknown")
        .sort((a: Friend, b: Friend) => {
          const getPriority = (t: number) =>
            t === 2 ? 3 : t === 1 ? 2 : t === 3 ? 1 : 0;
          return getPriority(b.presenceType) - getPriority(a.presenceType);
        });

      console.log("Final Friends List:", finalFriends);
      setFriends(finalFriends);
    } catch (err) {
      console.error("Failed to fetch friends metadata:", err);
    }
  };
  useEffect(() => {
    if (userId) {
      setIsLoading(true);
      Promise.all([fetchFavorites(), fetchFriends()]).finally(() =>
        setIsLoading(false),
      );
    }
  }, [userId]);

  if (!userId) {
    return <Welcome onLogin={handleLogin} />;
  }

  return (
    <div className="container">
      <BlurProvider>
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
      </BlurProvider>
    </div>
  );
}

export default App;
