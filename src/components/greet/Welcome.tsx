import { useState } from "react";
import Popup from "../misc/popup";
import { invoke } from "@tauri-apps/api/core";
import Logo from "../../assets/logo.png";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

interface WelcomeProps {
  onLogin: (id: number) => void;
}

type ViewState = "MENU" | "ID_INPUT" | "COOKIE_INPUT";

function Welcome({ onLogin }: WelcomeProps) {
  const [view, setView] = useState<ViewState>("MENU");
  const [inputValue, setInputValue] = useState("");

  const [showPopup, setShowPopup] = useState(false);

  const handleConfirmId = () => {
    const id = parseInt(inputValue);
    if (!isNaN(id)) {
      localStorage.setItem("login_method", "user_id");
      onLogin(id);
    } else {
      alert("Please enter a valid numeric ID");
    }
  };

  const handleConfirmCookie = async () => {
    try {
      console.log("Creating login window...");

      const loginWindow = new WebviewWindow("login", {
        url: "https://www.roblox.com/login",
        title: "Login to Roblox",
        width: 500,
        height: 700,
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      });

      loginWindow.once("tauri://created", async () => {
        console.log("Window successfully created");
        const userId = await invoke<number>("wait_for_login");

        localStorage.setItem("login_method", "cookie");
        onLogin(userId);
      });

      loginWindow.once("tauri://error", (e) => {
        console.error("Failed to create window:", e);
      });
    } catch (err) {
      console.error("Login failed:", err);
      alert("Login timed out or failed.");
    }
  };
  const selectMethod = (nextView: ViewState) => {
    setInputValue("");
    setView(nextView);
    setShowPopup(true);
  };

  return (
    <div className="launcher-wrapper">
      {/* POP-UP FOR USER ID */}
      {view === "ID_INPUT" && (
        <Popup
          isOpen={showPopup}
          title="UserId Limited Access"
          message="Note: Registering with UserId only allows you to view your favorites. You will not be able to see or join friends' games. For full functionality, please use the .ROBLOSECURITY cookie option.
          "
          confirmText="I Understand"
          onConfirm={() => setShowPopup(false)}
          onCancel={() => setView("MENU")}
        />
      )}

      {/* POP-UP FOR COOKIE */}
      {view === "COOKIE_INPUT" && (
        <Popup
          isOpen={showPopup}
          title="Security Disclosure"
          message='
          Login with Roblox gives us acces to your .ROBLOSECURITY cookie!

          What is this?
          A .ROBLOSECURITY cookie is a "Session Token." It is a unique digital key created when you log in. It tells Roblox you are already authenticated so you dont have to re-enter your password or 2FA code every time you use the launcher.
          
          Why is it sensitive? 
          Because this token represents an "active session," anyone who has it can bypass your Password and Two-Factor Authentication (2FA) instantly. It grants full access to your account, including Robux, limited items, and settings, without needing your actual login credentials.
           
          How we protect you:
           
          Local Only: Your cookie is never sent to any external servers. It stays on your machine.
           
          Direct Sync: The launcher uses the token only to communicate directly with official Roblox APIs.
           
          Encryption: The token is stored in an encrypted local database to prevent other basic software on your PC from reading it.
           
          Never share this string of text with anyone, including roblox staff members.'
          confirmText="Accept & Continue"
          onConfirm={() => setShowPopup(false)}
          onCancel={() => setView("MENU")}
        />
      )}

      <div className="welcome-card">
        <div className="header-section">
          <img src={Logo} alt="rebloxed logo" className="logo" />
          <h1>rebloxed launcher</h1>
          <p className="subtitle">The ultimate enhanced experience.</p>
        </div>

        <div className="content-section">
          {view === "MENU" && (
            <>
              <h2>Welcome aboard!</h2>
              <p>How would you like to sync your account?</p>
              <div className="button-group">
                <button
                  className="btn-primary"
                  onClick={() => selectMethod("ID_INPUT")}
                >
                  Register with UserId
                </button>
                <div className="divider">
                  <span>OR</span>
                </div>
                <button
                  className="btn-secondary"
                  onClick={() => selectMethod("COOKIE_INPUT")}
                >
                  Register with login
                </button>
              </div>
            </>
          )}

          {view === "ID_INPUT" && (
            <>
              <h2>Enter your UserId</h2>
              <p>Find this in your Roblox profile URL.</p>
              <input
                type="text"
                className="launcher-input"
                placeholder="e.g., 2669600234"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
              />
              <div className="button-group" style={{ marginTop: "20px" }}>
                <button className="btn-primary" onClick={handleConfirmId}>
                  Confirm & Login
                </button>
                <button className="btn-ghost" onClick={() => setView("MENU")}>
                  Back to menu
                </button>
              </div>
            </>
          )}

          {view === "COOKIE_INPUT" && (
            <>
              <h2>Login with roblox</h2>
              <div className="button-group" style={{ marginTop: "20px" }}>
                <button className="btn-primary" onClick={handleConfirmCookie}>
                  Login with Cookie
                </button>
                <button className="btn-ghost" onClick={() => setView("MENU")}>
                  Back to menu
                </button>
              </div>
            </>
          )}
        </div>

        <footer className="footer-note">
          <p>By using this launcher, you agree to our terms of service.</p>
        </footer>
      </div>
    </div>
  );
}

export default Welcome;
