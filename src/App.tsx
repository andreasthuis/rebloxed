import { useEffect, useState, useCallback } from "react";
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
  [key: string]: any;
}

function App() {
  const [userId, setUserId] = useState<number | null>(() => {
    if (localStorage.getItem("login_method") === "user_id") {
      const saved = localStorage.getItem("roblox_user_id");
      return saved ? parseInt(saved) : null;
    }
    return null;
  });

  const [greetName, setGreetName] = useState<string | null>();
  const [favorites, setFavorites] = useState<Game[]>([]);
  const [recommended, setRecommended] = useState<Game[]>([]);
  const [continueGames, setContinue] = useState<Game[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    if (!userId) return;
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
        validFriendIds.map((id: number) =>
          invoke<string>("roblox_request", {
            method: "GET",
            url: `https://users.roblox.com/v1/users/${id}`,
          }),
        ),
      );

      const { data: thumbData } = JSON.parse(thumbRes);
      const { userPresences } = JSON.parse(presenceRes);
      const namesData = namesRes.map((res: string) => JSON.parse(res));

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
            description: nameInfo?.description || "",
            created: nameInfo?.created || "",
            friends: true,
          };
        })
        .filter((friend: Friend) => friend.username !== "Unknown")
        .sort((a: Friend, b: Friend) => {
          const getPriority = (t: number) =>
            t === 2 ? 3 : t === 1 ? 2 : t === 3 ? 1 : 0;
          return getPriority(b.presenceType) - getPriority(a.presenceType);
        });

      setFriends(finalFriends);
    } catch (err) {
      console.error("Failed to fetch friends metadata:", err);
    }
  }, [userId]);

  useEffect(() => {
    if (localStorage.getItem("login_method") === "cookie") {
      invoke<any>("get_authenticated_user")
        .then((user) => {
          setGreetName(user.displayName);
          setUserId(user.id);
        })
        .catch((err) => {
          console.error("Failed to get authenticated user:", err);
          setUserId(null);
        });
    }
  }, []);

  useEffect(() => {
    if (userId) {
      setIsLoading(true);
      Promise.all([fetchFriends()]).finally(() => setIsLoading(false));
    }
  }, [userId, fetchFriends]);

  useEffect(() => {
    if (userId) {
      setRecommended([]);
      invoke<Game[]>("get_games_by_topic", {
        topic: "Recommended For You",
        provideThumbnail: true,
      })
        .then((res) => {
          console.log("Recommended Games:", res);
          setRecommended(res);
        })
        .catch((err) =>
          console.error("Failed to fetch recommended games:", err),
        );
      invoke<Game[]>("get_games_by_topic", {
        topic: "Continue",
        provideThumbnail: true,
        thumbnailType: "icon",
      })
        .then((res) => {
          console.log("Continue Games:", res);
          setContinue(res);
        })
        .catch((err) => console.error("Failed to fetch continue games:", err));
      invoke<Game[]>("get_games_by_topic", {
        topic: "Favorites",
        provideThumbnail: true,
        thumbnailType: "icon",
      })
        .then((res) => {
          console.log("Favorited Games:", res);
          setFavorites(res);
        })
        .catch((err) => console.error("Failed to fetch favorited games:", err));
    }
  }, [userId]);

  const handleLogin = (id: number) => {
    localStorage.setItem("roblox_user_id", id.toString());
    setUserId(id);
  };

  if (!userId) {
    return <Welcome onLogin={handleLogin} />;
  }

  return (
    <div className="container">
      <BlurProvider>
        <Topbar name={greetName} />
        {isLoading ? (
          <div className="loading-spinner">Loading your data...</div>
        ) : (
          <>
            <FriendsCarousel title="Friends" friends={friends} />
            <hr className="section-divider" />
            <GameCarousel title="Favorite Games" games={favorites} />
            <GameCarousel title="Continue" games={continueGames} />
            <GameCarousel title="Recommended For You" games={recommended} />
          </>
        )}
      </BlurProvider>
    </div>
  );
}

export default App;
