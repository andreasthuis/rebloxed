use std::process::Command;

/// Launch Roblox with cross-platform protocol handling
#[tauri::command(rename_all = "snake_case")]
pub async fn launch_roblox(place_id: String, server_id: Option<String>) -> Result<(), String> {
    let roblox_uri = match server_id {
        Some(id) if !id.trim().is_empty() => {
            format!("roblox://placeid={}&gameid={}", place_id, id)
        }
        _ => format!("roblox://placeid={}", place_id),
    };

    #[cfg(target_os = "linux")]
    {
        Command::new("flatpak")
            .args(["run", "org.vinegarhq.Sober", "--", &roblox_uri])
            .spawn()
            .map_err(|e| format!("Failed to launch Sober: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "start", &roblox_uri])
            .spawn()
            .map_err(|e| format!("Failed to launch Roblox: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&roblox_uri)
            .spawn()
            .map_err(|e| format!("Failed to launch Roblox: {}", e))?;
    }

    Ok(())
}
