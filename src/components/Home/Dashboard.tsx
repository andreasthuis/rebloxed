import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import FriendsCarousel from "../User/FriendsCarousel";
import GameCarousel from "../Game/GameCarousel";
import GameGallery from "../Game/GameGallery";
import { Game, User as Friend } from "../../types";

interface DashboardProps {
  userId: number;
}

const Dashboard: React.FC<DashboardProps> = ({ userId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<Game[]>([]);
  const [recommended, setRecommended] = useState<Game[]>([]);
  const [continueGames, setContinue] = useState<Game[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
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
        console.error("Failed to load dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="initial-load">
        <div className="loading-spinner" />
        <div className="loading-text">Loading your homepage...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <FriendsCarousel title="Friends" friends={friends} />
      <hr className="section-divider" />
      {favorites.length > 0 && (
        <GameCarousel title="Favorite Games" games={favorites} />
      )}
      {continueGames.length > 0 && (
        <GameCarousel title="Continue" games={continueGames} />
      )}
      <GameGallery title="Recommended For You" games={recommended} />
    </div>
  );
};

export default Dashboard;
