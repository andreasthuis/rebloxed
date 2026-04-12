import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { BlurProvider } from "./components/misc/BlurContext";
import Topbar from "./components/Home/Topbar";
import Welcome from "./components/greet/Welcome";
import Dashboard from "./components/Home/Dashboard";
import Discovery from "./components/Home/Discovery";
import { ActiveView, UserProfile } from "./types";
import "./App.css";

function App() {
  const [userId, setUserId] = useState<number | null>(null);
  const [mainUser, setMainUser] = useState<UserProfile | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>("Home");
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        const method = localStorage.getItem("login_method");
        let activeId: number | null = null;

        if (method === "cookie") {
          const authUser = await invoke<any>("get_authenticated_user");
          activeId = authUser.id;
        } else if (method === "user_id") {
          const saved = localStorage.getItem("roblox_user_id");
          if (saved) activeId = parseInt(saved);
        }

        if (activeId && isMounted) {
          setUserId(activeId);
          const profile = await invoke<UserProfile>("get_user", {
            id: activeId,
          });
          setMainUser(profile);
        }
      } catch (err) {
        console.error("Auth error:", err);
      } finally {
        if (isMounted) setIsBooting(false);
      }
    };
    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = (id: number) => {
    localStorage.setItem("roblox_user_id", id.toString());
    localStorage.setItem("login_method", "user_id");
    setUserId(id);
    window.location.reload();
  };

  const renderView = () => {
    if (!userId) return null;
    switch (activeView) {
      case "Home":
        return <Dashboard userId={userId} />;
      case "Games":
        return <Discovery />;
      case "Settings":
        return <div className="view-placeholder">Settings coming soon...</div>;
      default:
        return <Dashboard userId={userId} />;
    }
  };

  if (isBooting) {
    return (
      <div className="initial-load fullscreen">
        <div className="loading-spinner" />
        <div className="loading-text">Booting up...</div>
      </div>
    );
  }

  if (!userId) return <Welcome onLogin={handleLogin} />;

  return (
    <div className="container">
      <BlurProvider>
        <Topbar
          user={mainUser}
          activeView={activeView}
          setView={setActiveView}
        />
        <main className="main-content">{renderView()}</main>
      </BlurProvider>
    </div>
  );
}

export default App;
