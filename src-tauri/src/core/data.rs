use reqwest::Client;
use tauri_plugin_keyring::KeyringExt;
use tauri_plugin_log::log;

#[tauri::command]
pub async fn roblox_request(
    app: tauri::AppHandle,
    method: String,
    url: String,
    body: Option<String>,
) -> Result<String, String> {
    let cookie = app
        .keyring()
        .get_password("rebloxed", "roblosecurity")
        .map_err(|e| e.to_string())?
        .ok_or("No saved cookie found. Please log in.")?;

    let client = Client::new();

    let mut req = match method.as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        _ => return Err("Unsupported method".into()),
    };

    req = req.header("Cookie", format!(".ROBLOSECURITY={}", cookie));

    if let Some(b) = body {
        req = req.header("Content-Type", "application/json").body(b);
    }

    let res = req.send().await.map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        log::error!("Request to {} {} failed with status {}", method, url, res.status());
        return Err(format!("Request failed: {}", res.status()));
    }

    let request_data = res.text().await.map_err(|e| e.to_string())?;

    Ok(request_data)
}
