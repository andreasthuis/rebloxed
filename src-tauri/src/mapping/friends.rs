use ro_rs::{
    thumbnails::{AvatarThumbnailType, ThumbnailFormat},
    Client,
};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use futures::future::join_all;

use crate::core::data::roblox_request;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Friend {
    pub id: i64,
    pub display_name: String,
    pub username: String,
    pub avatar_url: String,
    pub presence_type: u64,
    pub is_online: bool,
    pub presence: String,
    pub game_id: Option<String>,
    pub presence_data: serde_json::Value,
    pub description: String,
    pub created: String,
    pub friends: bool,
}

#[tauri::command]
pub async fn get_user_friends(app: AppHandle, user_id: i64) -> Result<Vec<Friend>, String> {
    let client = Client::new();

    let user = client.get_user(user_id).await.map_err(|e| e.to_string())?;
    let friends_list = user.get_friends().await.map_err(|e| e.to_string())?;

    if friends_list.is_empty() {
        return Ok(vec![]);
    }

    let friend_ids: Vec<u64> = friends_list
        .iter()
        .filter(|f| f.id > 0)
        .map(|f| f.id as u64)
        .collect();

    if friend_ids.is_empty() {
        return Ok(vec![]);
    }

    let presence_body = serde_json::json!({ "userIds": friend_ids });
    
    let (thumb_res, presence_raw) = tokio::join!(
        client.thumbnails.get_user_avatar_thumbnails(
            &friend_ids,
            "150x150",
            ThumbnailFormat::Png,
            true,
            AvatarThumbnailType::HeadShot
        ),
        roblox_request(
            app.clone(),
            "POST".to_string(),
            "https://presence.roblox.com/v1/presence/users".to_string(),
            Some(presence_body.to_string()),
        )
    );

    let name_futures = friend_ids.iter().map(|id| {
        roblox_request(
            app.clone(),
            "GET".to_string(),
            format!("https://users.roblox.com/v1/users/{}", id),
            None,
        )
    });
    let names_raw = join_all(name_futures).await;

    let thumbs = thumb_res.map_err(|e| e.to_string())?;
    
    let presence_str = presence_raw.map_err(|e| format!("Presence Request Failed: {}", e))?;
    let presence_json: serde_json::Value = serde_json::from_str(&presence_str)
        .map_err(|e| format!("Presence Parse Error: {}. Raw: {}", e, presence_str))?;
    
    let user_presences = presence_json["userPresences"]
        .as_array()
        .ok_or("Invalid presence response format")?;

    let names: Vec<serde_json::Value> = names_raw.into_iter()
        .filter_map(|r| r.ok())
        .filter_map(|s| serde_json::from_str(&s).ok())
        .collect();

    let mut final_friends: Vec<Friend> = friends_list
        .into_iter()
        .filter(|f| f.id > 0)
        .map(|f| {
            let id_i64 = f.id;
            let id_u64 = f.id as u64;

            let n_match = names.iter().find(|n| n["id"].as_i64() == Some(id_i64));
            let p_match = user_presences.iter().find(|p| p["userId"].as_i64() == Some(id_i64));
            let t_match = thumbs.iter().find(|t| t.target_id == id_u64);

            let p_type = p_match.and_then(|p| p["userPresenceType"].as_u64()).unwrap_or(0);

            Friend {
                id: id_i64,
                display_name: n_match.and_then(|n| n["displayName"].as_str()).unwrap_or(&f.display_name).to_string(),
                username: n_match.and_then(|n| n["name"].as_str()).unwrap_or(&f.name).to_string(),
                avatar_url: t_match.and_then(|t| t.image_url.clone()).unwrap_or_default(),
                presence_type: p_type,
                is_online: p_type > 0,
                presence: match p_type {
                    2 => "In Game",
                    3 => "In Studio",
                    1 => "Online",
                    _ => "Offline",
                }.to_string(),
                game_id: p_match.and_then(|p| p["gameId"].as_str()).map(|s| s.to_string()),
                presence_data: p_match.cloned().unwrap_or(serde_json::Value::Null),
                description: n_match.and_then(|n| n["description"].as_str()).unwrap_or("").to_string(),
                created: n_match.and_then(|n| n["created"].as_str()).unwrap_or("").to_string(),
                friends: true,
            }
        })
        .collect();

    final_friends.sort_by(|a, b| {
        let score = |p| match p { 2 => 3, 1 => 2, 3 => 1, _ => 0 };
        score(b.presence_type).cmp(&score(a.presence_type))
    });

    Ok(final_friends)
}