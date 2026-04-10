import { useState } from "react";
import UserProfileModal from "../User/UserProfileModal";

interface TopbarProps {
  user: { [key: string]: any } | null;
}

function Topbar({ user }: TopbarProps) {
  const [selectedProfile, setSelectedProfile] = useState<true | false>(false);
  
  return (
    <nav className="main-nav">
      <div className="nav-container">
        <div className="nav-left">
          <div className="nav-links">
            <a href="#" className="nav-link active">
              Home
            </a>
            <a href="#" className="nav-link">
              Games
            </a>
            <a href="#" className="nav-link">
              Catalog
            </a>
            <a href="#" className="nav-link">
              Groups
            </a>
          </div>
        </div>

        <div className="nav-right">
          <div className="search-bar">
            <input type="text" placeholder="Search games..." />
          </div>

          <div className="nav-user-info">
            <span className="welcome-text">
              Welcome, <strong>{user?.displayName || "Guest"}</strong>
            </span>
            <div className="nav-profile">
              <img
                className="nav-avatar"
                src={user?.avatarUrl || ""}
                alt="Profile"
                onClick={() => setSelectedProfile(true)}
              />
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
