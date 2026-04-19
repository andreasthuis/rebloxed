import { useState, useEffect } from "react";
import UserProfileModal from "../User/UserProfileModal";
import { UserProfile, ActiveView } from "../../types";
import { invoke } from "@tauri-apps/api/core";
import Robux from "../../assets/Robux.webp";

interface TopbarProps {
  user: UserProfile | null;
  activeView: ActiveView;
  setView: (view: ActiveView, params?: { query: string }) => void;
}

function Topbar({ user, activeView, setView }: TopbarProps) {
  const [selectedProfile, setSelectedProfile] = useState<boolean>(false);
  const [robux, setRobux] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const menu: ActiveView[] = ["Home", "Games", "Settings"];

  useEffect(() => {
    const loadRobux = async () => {
      try {
        let res = await invoke<number>("get_currency");
        setRobux(res);
      } catch (err) {
        console.error("Failed to fetch Robux:", err);
      }
    };
    loadRobux();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setView("Search" as ActiveView);
      console.log("Searching for:", searchInput);
    }
  };

  return (
    <nav className="main-nav">
      <div className="nav-container">
        <div className="nav-left">
          <div className="nav-links">
            {menu.map((item) => (
              <a
                key={item}
                className={`nav-link ${activeView === item ? "active" : ""}`}
                onClick={() => setView(item)}
              >
                {item}
              </a>
            ))}
          </div>
        </div>

        <div className="nav-right">
          <form className="search-bar" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search games..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit" style={{ display: "none" }} />
          </form>

          <div className="nav-user-info">
            <span className="welcome-text">
              Welcome, <strong>{user?.displayName || "Guest"}</strong>
            </span>
            <div className="nav-profile">
              <img
                className="nav-avatar"
                src={user?.avatarUrl || ""}
                alt="Profile"
                style={{ cursor: "pointer" }}
                onClick={() => setSelectedProfile(true)}
              />
            </div>
            <div className="nav-robux-counter">
              <img className="nav-robux-icon" src={Robux} alt="robux" />
              <p>{robux?.toLocaleString() ?? "..."}</p>
            </div>
          </div>
        </div>
      </div>
      {selectedProfile && user && (
        <UserProfileModal
          prop={user.id}
          onClose={() => setSelectedProfile(false)}
        />
      )}
    </nav>
  );
}

export default Topbar;
