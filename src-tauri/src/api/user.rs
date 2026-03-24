use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::AppHandle;

use crate::core::data;

#[derive(Serialize)]
pub struct User {
    pub id: u64,
    pub display_name: String,
    pub username: String,
    pub avatar_url: Option<String>,
    pub presence_type: i64,
    pub is_online: bool,
    pub presence: String,
    pub game_id: Option<String>,
    pub presence_data: Value,
    pub created: Option<String>,
    pub description: Option<String>,
}

#[tauri::command]
pub async fn get_user(app: AppHandle, id: u64) -> Result<User, String> {
    let thumb_url = format!(
        "https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds={id}&size=150x150&format=Png&isCircular=true"
    );

    let presence_body = format!(r#"{{"userIds":[{id}]}}"#);

    let user_url = format!("https://users.roblox.com/v1/users/{id}");

    let (thumb_res, presence_res, user_res) = tokio::try_join!(
        data::roblox_request(app.clone(), "GET".into(), thumb_url, None),
        data::roblox_request(app.clone(), "POST".into(), "https://presence.roblox.com/v1/presence/users".into(), Some(presence_body)),
        data::roblox_request(app.clone(), "GET".into(), user_url, None),
    )?;

    let thumb_json: Value = serde_json::from_str(&thumb_res).map_err(|e| e.to_string())?;
    let presence_json: Value = serde_json::from_str(&presence_res).map_err(|e| e.to_string())?;
    let user_json: Value = serde_json::from_str(&user_res).map_err(|e| e.to_string())?;

    let thumb = &thumb_json["data"][0];
    let presence = &presence_json["userPresences"][0];

    let p_type = presence["userPresenceType"].as_i64().unwrap_or(0);

    let presence_text = match p_type {
        2 => "In Game",
        3 => "In Studio",
        1 => "Online",
        _ => "Offline",
    }
    .to_string();

    Ok(User {
        id,
        display_name: user_json["displayName"]
            .as_str()
            .unwrap_or("Unknown Player")
            .to_string(),
        username: user_json["name"]
            .as_str()
            .unwrap_or("Unknown")
            .to_string(),
        avatar_url: thumb["imageUrl"].as_str().map(|s| s.to_string()),
        presence_type: p_type,
        is_online: p_type > 0,
        presence: presence_text,
        game_id: presence["id"].as_str().map(|s| s.to_string()),
        presence_data: presence.clone(),
        created: user_json["created"].as_str().map(|s| s.to_string()),
        description: user_json["description"].as_str().map(|s| s.to_string()),
    })
}