interface TopbarProps {
  name: string | null | undefined;
}

function Topbar({ name }: TopbarProps) {
  return (
    <nav className="main-nav">
      <div className="nav-container">
        <div className="nav-left">
          <div className="nav-links">
            <a href="#" className="nav-link active">Home</a>
            <a href="#" className="nav-link">Games</a>
            <a href="#" className="nav-link">Catalog</a>
            <a href="#" className="nav-link">Groups</a>
          </div>
        </div>

        <div className="nav-right">
          <div className="search-bar">
            <input type="text" placeholder="Search games..." />
          </div>
          
          <div className="nav-user-info">
            <span className="welcome-text">
              Welcome, <strong>{name || "Guest"}</strong>
            </span>
            <div className="nav-profile">
              <div className="nav-avatar-placeholder" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Topbar;