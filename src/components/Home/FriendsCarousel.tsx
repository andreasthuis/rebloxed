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
  const [maxIndex, setMaxIndex] = useState(0);
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const startX = useRef<number | null>(null);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault(); // stop page scrolling

    const direction =
      Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

    if (direction > 0) {
      next();
    } else {
      prev();
    }
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

  const handleTouchEnd = () => {
    startX.current = null;
  };

  const cardWidth = 120;
  const gap = 15;
  const step = cardWidth + gap;

  useEffect(() => {
    const calculateMaxScroll = () => {
      if (viewportRef.current) {
        const viewportWidth = viewportRef.current.clientWidth;
        const totalContentWidth =
          friends.length * cardWidth + (friends.length - 1) * gap;
        const maxScrollPx = Math.max(0, totalContentWidth - viewportWidth);

        setMaxIndex(Math.ceil(maxScrollPx / step));
      }
    };

    calculateMaxScroll();
    window.addEventListener("resize", calculateMaxScroll);
    return () => window.removeEventListener("resize", calculateMaxScroll);
  }, [friends.length, step]);

  const next = () => setIndex((prev) => Math.min(prev + 1, maxIndex));
  const prev = () => setIndex((prev) => Math.max(prev - 1, 0));

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
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="track"
            style={{
              transform: `translateX(-${index * step}px)`,
              display: "flex",
              gap: `${gap}px`,
              transition: "transform 0.3s ease-out",
            }}
          >
            {friends.map((friend) => (
              <div
                className="friend-card"
                key={friend.id}
                onClick={() => setSelectedFriend(friend)}
                style={{ width: cardWidth, flexShrink: 0 }}
              >
                <div className="avatar-wrapper">
                  <img src={friend.avatarUrl} alt={friend.displayName} />
                  {friend.presence == "Online" && (
                    <div className="online-indicator" />
                  )}
                  {friend.presence == "In Game" && (
                    <div className="game-indicator"></div>
                  )}
                </div>
                <p className="display-name">{friend.displayName}</p>
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
