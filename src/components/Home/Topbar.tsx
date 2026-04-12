import { useState } from "react";
import UserProfileModal from "../User/UserProfileModal";
import { UserProfile, ActiveView } from "../../types";
interface TopbarProps {
  user: UserProfile | null;
  activeView: ActiveView;
  setView: (view: ActiveView) => void;
}

function Topbar({ user, activeView, setView }: TopbarProps) {
  const [selectedProfile, setSelectedProfile] = useState<true | false>(false);
  const menu: ActiveView[] = ["Home", "Games", "Settings"];

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
