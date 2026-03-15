use reqwest::Client;
use serde::Deserialize;

#[derive(Deserialize)]
#[allow(dead_code)]
struct AuthResponse {
    id: u64,
    name: String,
    #[serde(rename = "displayName")]
    display_name: String,
}

#[tauri::command]
pub async fn verify_cookie(cookie: String) -> Result<u64, String> {
    println!("--- DEBUG: Starting verification ---");

    let client = Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;

    println!("DEBUG: Sending request to Roblox...");

    let res = client
        .get("https://users.roblox.com/v1/users/authenticated")
        .header("Cookie", format!(".ROBLOSECURITY={}", cookie))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        let body = res.text().await.unwrap_or_default();
        println!("DEBUG: Request failed: {}", body);
        return Err("Invalid cookie".into());
    }

    let data: AuthResponse = res.json().await.map_err(|e| e.to_string())?;

    println!(
        "DEBUG: Successfully verified user {} ({})",
        data.name, data.id
    );

    Ok(data.id)
}