use tauri::AppHandle;
use serde_json::Value;
use crate::core::data::roblox_request;

#[tauri::command]
pub async fn get_currency(app: AppHandle) -> Result<u64, String> {
    let res = roblox_request(
        app, 
        "GET".into(), 
        "https://economy.roblox.com/v1/user/currency".into(), 
        None
    ).await
    .map_err(|e| e.to_string())?;

    let json: Value = serde_json::from_str(&res)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    let amount = json["robux"]
        .as_u64()
        .ok_or_else(|| "Field 'robux' missing or not a number".to_string())?;

    Ok(amount)
}