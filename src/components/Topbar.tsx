import { fetch } from "@tauri-apps/plugin-http";
import { invoke } from "@tauri-apps/api/core";

function Topbar() {
  const handleClick = async () => {
    try {
      const response = await fetch("https://api.example.com/data");
      const data = await response.json();
      console.log(data);

      await invoke("login");
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div className="topbar">
      <h1>My App</h1>
      <button onClick={handleClick}>Fetch Data</button>
    </div>
  );
}

export default Topbar;