import UserProfileDetails from "./UserProfileDetails";

interface User {
  id: number;
  displayName: string;
  username: string;
  avatarUrl?: string;
  isOnline: boolean;
}

interface UserProfileModalProps {
  user: User | null;
  onClose: () => void;
}

const UserProfileModal = ({ user, onClose }: UserProfileModalProps) => {
  // Return null early if no user is selected to avoid rendering an empty overlay
  if (!user) return null;

  return (
    <div className="modal-overlay" onClick={onClose} aria-modal="true" role="dialog">
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="modal-close-btn" 
          onClick={onClose}
          aria-label="Close profile"
        >
          ✕
        </button>
        
        <UserProfileDetails user={user} />
      </div>
    </div>
  );
};

export default UserProfileModal;