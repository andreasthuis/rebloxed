import { useEffect, useState } from "react";
import GameCarousel from "./components/Game/GameCarousel";
import FriendsCarousel from "./components/User/FriendsCarousel";
import "./App.css";
import Topbar from "./components/Home/Topbar";
import Welcome from "./components/greet/Welcome";
import { invoke } from "@tauri-apps/api/core";
import { BlurProvider } from "./components/misc/BlurContext";
import GameGallery from "./components/Game/GameGallery";

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
  playerCount: number;
  [key: string]: any;
}

function App() {
  const [userId, setUserId] = useState<number | null>(null);
  const [isBooting, setIsBooting] = useState(true);

  const [greetName, setGreetName] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Game[]>([]);
  const [recommended, setRecommended] = useState<Game[]>([]);
  const [continueGames, setContinue] = useState<Game[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;

      if (target.tagName === "IMG" || target.tagName === "A") {
        e.preventDefault();
      }
    };

    document.addEventListener("dragstart", handleDragStart);

    return () => {
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const method = localStorage.getItem("login_method");

        if (method === "cookie") {
          const user = await invoke<any>("get_authenticated_user");
          setGreetName(user.displayName);
          setUserId(user.id);
        } else if (method === "user_id") {
          const saved = localStorage.getItem("roblox_user_id");
          if (saved) setUserId(parseInt(saved));
        }
      } catch (err) {
        console.error("Failed to get authenticated user:", err);
        setUserId(null);
      } finally {
        setIsBooting(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const loadAllData = async () => {
      setIsLoading(true);

      try {
        const [recommendedRes, continueRes, favoritesRes, friendsRes] =
          await Promise.all([
            invoke<Game[]>("get_games_by_topic", {
              topic: "Recommended For You",
              provideThumbnail: true,
            }),
            invoke<Game[]>("get_games_by_topic", {
              topic: "Continue",
              provideThumbnail: true,
              thumbnailType: "icon",
            }),
            invoke<Game[]>("get_games_by_topic", {
              topic: "Favorites",
              provideThumbnail: true,
              thumbnailType: "icon",
            }),
            invoke<Friend[]>("get_user_friends", { userId }),
          ]);

        setRecommended(recommendedRes);
        setContinue(continueRes);
        setFavorites(favoritesRes);
        setFriends(friendsRes);
      } catch (err) {
        console.error("Failed to load app data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, [userId]);

  const handleLogin = (id: number) => {
    localStorage.setItem("roblox_user_id", id.toString());
    localStorage.setItem("login_method", "user_id");
    setUserId(id);
  };

  if (isBooting) {
    return (
      <div className="initial-load fullscreen">
        <div className="loading-spinner" />
        <div className="loading-text">Booting up...</div>
      </div>
    );
  }

  if (!userId) {
    return <Welcome onLogin={handleLogin} />;
  }

  return (
    <div className="container">
      <BlurProvider>
        <Topbar name={greetName} />

        {isLoading ? (
          <div className="initial-load">
            <div className="loading-spinner" />
            <div className="loading-text">Loading your data...</div>
          </div>
        ) : (
          <>
            <FriendsCarousel title="Friends" friends={friends} />
            <hr className="section-divider" />
            <GameCarousel title="Favorite Games" games={favorites} />
            <GameCarousel title="Continue" games={continueGames} />
            <GameGallery title="Recommended For You" games={recommended} />
          </>
        )}
      </BlurProvider>
    </div>
  );
}

export default App;
