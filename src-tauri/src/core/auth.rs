use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri_plugin_keyring::KeyringExt;
use tauri_plugin_log::log;

#[derive(Debug, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct AuthResponse {
    pub id: u64,
    pub name: String,
    #[serde(rename = "displayName")]
    pub display_name: String,
}
#[tauri::command]
pub async fn login_with_cookie(app: tauri::AppHandle, cookie: String) -> Result<u64, String> {
    println!("Verifying cookie…");

    let client = Client::new();

    let res = client
        .get("https://users.roblox.com/v1/users/authenticated")
        .header("Cookie", format!(".ROBLOSECURITY={}", cookie))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err("Invalid cookie".into());
    }

    let data: AuthResponse = res.json().await.map_err(|e| e.to_string())?;

    app.keyring()
        .set_password("rebloxed", "roblosecurity", &cookie)
        .map_err(|e| e.to_string())?;

    println!("Logged in as {} ({})", data.name, data.id);

    Ok(data.id)
}

#[tauri::command]
pub async fn get_authenticated_user(app: tauri::AppHandle) -> Result<AuthResponse, String> {
    let cookie = app
        .keyring()
        .get_password("rebloxed", "roblosecurity")
        .map_err(|e| e.to_string())?
        .ok_or("No saved cookie found. Please log in.")?;

    let client = Client::new();

    let res = client
        .get("https://users.roblox.com/v1/users/authenticated")
        .header("Cookie", format!(".ROBLOSECURITY={}", cookie))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    log::info!("Status: {}", res.status());

    if !res.status().is_success() {
        return Err(format!("Roblox API error: {}", res.status()));
    }

    let user_data: AuthResponse = res.json().await.map_err(|e| e.to_string())?;

    log::info!(
        "Authenticated as: {} (ID: {})",
        user_data.name, user_data.id
    );

    Ok(user_data)
}
