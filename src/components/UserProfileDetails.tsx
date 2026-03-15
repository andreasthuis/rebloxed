import { useState } from "react";

interface User {
  id: number;
  displayName: string;
  username: string;
  avatarUrl?: string;
  isOnline: boolean;
  presence?: string;
  description?: string;
  joinDate?: string;
  followerCount?: number;
  followingCount?: number;
}

interface UserProfileDetailsProps {
  user: User;
}

const UserProfileDetails = ({ user }: UserProfileDetailsProps) => {
  const [activeTab, setActiveTab] = useState<"about" | "friends">("about");
  const [loadingFriends, _setLoadingFriends] = useState(false);

  const formatNum = (num: number) => {
    return Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(num);
  };

  return (
    <div className="user-profile-details">
      <div className="details-header">
        <div className="avatar-container">
          <img src={user.avatarUrl} alt={user.displayName} className="details-avatar" />
          {user.isOnline && <span className="status-badge online" />}
        </div>
        
        <div className="details-info">
          <h1>{user.displayName}</h1>
          <p className="username">@{user.username}</p>
          <p className="presence-text">{user.presence || "Offline"}</p>
          
          <div className="action-buttons">
            <button className="primary-btn message-btn">
              Message
            </button>
            <button className="secondary-btn add-friend">Add Friend</button>
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
          Friends
        </button>
      </div>

      <div className="details-body">
        {activeTab === "about" ? (
          <>
            <div className="stats-row">
              <div className="stat">
                <strong>Followers</strong>
                <br />
                {formatNum(user.followerCount || 0)}
              </div>
              <div className="stat">
                <strong>Following</strong>
                <br />
                {formatNum(user.followingCount || 0)}
              </div>
              <div className="stat">
                <strong>Joined</strong>
                <br />
                {user.joinDate ? new Date(user.joinDate).toLocaleDateString() : "N/A"}
              </div>
            </div>

            <h3>Bio</h3>
            <p className="description user-bio">
              {user.description || "This user hasn't added a bio yet."}
            </p>
          </>
        ) : (
          <div className="friends-list-tab">
            {loadingFriends ? (
              <p>Loading friends...</p>
            ) : (
              <p>Social features and friend lists would appear here.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileDetails;