import { useState, useRef, useEffect } from "react";
import UserProfileModal from "../User/UserProfileModal";

interface User {
  id: number;
  displayName: string;
  username: string;
  avatarUrl: string;
  presenceType: number;
  isOnline: boolean;
  presence: string;
  gameId: string | null;
  presenceData: any;
  created: string;
}

interface FriendsCarouselProps {
  title: string;
  friends: User[];
}

const FriendsCarousel = ({ title, friends }: FriendsCarouselProps) => {
  const [index, setIndex] = useState(0);
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);

  const cardWidth = 120;
  const gap = 15;
  const step = cardWidth + gap;
  const buffer = 4;

  const lockBodyScroll = () => (document.body.style.overflow = "hidden");
  const unlockBodyScroll = () => (document.body.style.overflow = "");

  const [visibleCount, setVisibleCount] = useState(0);
  useEffect(() => {
    const updateVisibleCount = () => {
      const width = viewportRef.current?.clientWidth || 1000;
      setVisibleCount(Math.floor(width / step));
    };
    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, [step]);

  const maxIndex = Math.max(0, friends.length - visibleCount);

  const next = () => setIndex((prev) => Math.min(prev + 1, maxIndex));
  const prev = () => setIndex((prev) => Math.max(prev - 1, 0));

  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) < 5 && Math.abs(e.deltaY) < 5) return;

    const direction =
      Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (direction > 0) next();
    else prev();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null) return;
    const diff = startX.current - e.touches[0].clientX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
      startX.current = null;
    }
  };

  const start = Math.max(0, index - buffer);
  const end = Math.min(friends.length, index + visibleCount + buffer);
  const visibleFriends = friends.slice(start, end);

  return (
    <div className="friends-carousel-section">
      <div className="carousel-header">
        <h1>
          {title} ({friends.length})
        </h1>
      </div>

      <div className="carousel-container">
        <div
          className="viewport"
          ref={viewportRef}
          style={{ overflow: "hidden", width: "100%" }}
          onWheel={handleWheel}
          onMouseEnter={lockBodyScroll}
          onMouseLeave={unlockBodyScroll}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => (startX.current = null)}
        >
          <div
            className="track"
            style={{
              display: "flex",
              gap: `${gap}px`,
              transform: `translateX(-${index * step}px)`,
              paddingLeft: `${start * step}px`,
              transition: "transform 0.3s ease-out",
              width: "max-content",
            }}
          >
            {visibleFriends.map((friend) => (
              <div
                className="friend-card"
                key={friend.id}
                onClick={() => setSelectedFriend(friend)}
                style={{ width: cardWidth, flexShrink: 0 }}
              >
                <div className="avatar-wrapper">
                  <img src={friend.avatarUrl} alt={friend.displayName} />
                  {friend.presence === "Online" && (
                    <div className="online-indicator" />
                  )}
                  {friend.presence === "In Game" && (
                    <div className="game-indicator" />
                  )}
                </div>

                <p className="display-name">{friend.displayName}</p>
                <p className="friend-ingame">
                  {friend.isOnline && friend.presenceData?.lastLocation}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedFriend && (
        <UserProfileModal
          prop={selectedFriend}
          onClose={() => setSelectedFriend(null)}
        />
      )}
    </div>
  );
};

export default FriendsCarousel;
