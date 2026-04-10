import { useState, useEffect } from "react";
import { fetch } from "@tauri-apps/plugin-http";
import { invoke } from "@tauri-apps/api/core";
import UserProfileDetails from "../User/UserProfileModal";
import GroupDetails from "../Group/GroupModal";

interface GameDetailsProps {
  game: any;
}

const GameDetails = ({ game }: GameDetailsProps) => {
  const [activeTab, setActiveTab] = useState<"about" | "servers">("about");
  const [servers, setServers] = useState<any[]>([]);
  const [loadingServers, setLoadingServers] = useState(false);

  const [showProfile, setShowProfile] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const [showGroup, setShowGroup] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(null);

  const openCreatorPage = () => {
    if (game?.creator?.type === "User") {
      setProfileUserId(game.creator.id.toString());
      setShowProfile(true);
    } else if (game?.creator?.type === "Group") {
      setGroupId(game.creator.id.toString());
      setShowGroup(true);
    }
  };

  const formatNum = (num: number) => {
    return Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(num);
  };

  const launchRoblox = async (placeId: number, serverId?: string) => {
    try {
      console.log(`Requesting backend to launch Place ID: ${placeId}`);
      await invoke("launch_roblox", {
        place_id: placeId.toString(),
        serverId: serverId || null,
      });

      console.log("Launch command successfully sent to the system.");
    } catch (err) {
      console.error("Failed to launch Roblox via backend:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "servers" && game.rootPlaceId) {
      fetchServers();
    }
  }, [activeTab]);

  const fetchServers = async () => {
    setLoadingServers(true);
    try {
      const res = await fetch(
        `https://games.roblox.com/v1/games/${game.rootPlaceId}/servers/Public?limit=10`,
      );
      const json = await res.json();
      setServers(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingServers(false);
    }
  };

  return (
    <div className="game-details">
      <div className="details-header">
        <img src={game.thumbnail} alt={game.name} className="details-thumbnail" />
        <div className="details-info">
          <h1>{game.name}</h1>
          <p className="creator" onClick={openCreatorPage}>
            By @{game?.creator?.name || "Unknown"}
          </p>
          <button
            className="play-button"
            onClick={() => launchRoblox(game?.rootPlaceId, undefined)}
          >
            Play
          </button>
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
          className={`tab-btn ${activeTab === "servers" ? "active" : ""}`}
          onClick={() => setActiveTab("servers")}
        >
          Servers
        </button>
      </div>

      <div className="details-body">
        {activeTab === "about" ? (
          <>
            <div className="stats-row">
              <div className="stat">
                <strong>Active</strong>
                <br />
                {formatNum(game?.playing || 0)}
              </div>

              <div className="stat">
                <strong>Favorites</strong>
                <br />
                {formatNum(game?.favoritedCount || 0)}
              </div>

              <div className="stat">
                <strong>Visits</strong>
                <br />
                {formatNum(game?.visits || 0)}
              </div>

              <div className="stat">
                <strong>Updated</strong>
                <br />
                {game?.updated
                  ? new Date(game.updated).toLocaleDateString()
                  : "N/A"}
              </div>

              <div className="stat">
                <strong>Created</strong>
                <br />
                {game?.created
                  ? new Date(game.created).toLocaleDateString()
                  : "N/A"}
              </div>
            </div>
            <h3>About</h3>
            <p className="description game-description">{game.description}</p>
          </>
        ) : (
          <div className="servers-list">
            {loadingServers ? (
              <p>Loading servers...</p>
            ) : servers.length > 0 ? (
              servers.map((server) => (
                <div key={server.id} className="server-card">
                  <div className="server-main">
                    <div className="server-stats">
                      <p className="player-count">
                        Players:{" "}
                        <strong>
                          {server.playing} / {server.maxPlayers}
                        </strong>
                      </p>
                      <div className="server-meta">
                        <span>Ping: {server.ping}ms</span>
                        <span>FPS: {Math.round(server.fps)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    className="join-btn"
                    onClick={() => launchRoblox(game?.rootPlaceId, server.id)}
                  >
                    Join
                  </button>
                </div>
              ))
            ) : (
              <p>No public servers found.</p>
            )}
          </div>
        )}
      </div>
      {showProfile && profileUserId && (
        <UserProfileDetails
          prop={game?.creator?.id}
          onClose={() => setShowProfile(false)}
        />
      )}
      {showGroup && groupId && (
        <GroupDetails
          group={game?.creator?.id}
          onClose={() => setShowGroup(false)}
        />
      )}
    </div>
  );
};

export default GameDetails;
