use ro_rs::{
    thumbnails::{AvatarThumbnailType, ThumbnailFormat},
    Client,
};
use serde::Serialize;
use tauri::AppHandle;
use tauri_plugin_log::log;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: u64,
    pub display_name: String,
    pub username: String,
    pub avatar_url: Option<String>,
    pub presence_type: u64,
    pub is_online: bool,
    pub presence: String,
    pub created: Option<String>,
    pub description: String,
}

#[tauri::command]
pub async fn get_user(_app: AppHandle, id: u64) -> Result<User, String> {
    let client = Client::new();

    let user_ids = vec![id]; 
    let id_slice = &user_ids;

    let (user_res, presence_res, thumb_res) = tokio::join!(
        client.get_user(id),
        client.presence.get_user_presences(id_slice),
        client.thumbnails.get_user_avatar_thumbnails(
            id_slice,
            "150x150", 
            ThumbnailFormat::Png, 
            true, 
            AvatarThumbnailType::HeadShot
        )
    );

    let user_info = user_res.map_err(|e| format!("User Error: {:?}", e))?;
    let presences = presence_res.map_err(|e| format!("Presence Error: {:?}", e))?;
    let thumbs = thumb_res.map_err(|e| format!("Thumbnail Error: {:?}", e))?;

    let description = user_info.description;

    let created = user_info.created.map(|dt| dt.to_rfc3339());

    let p_type: u64 = presences
        .first()
        .and_then(|p| p.user_presence_type)
        .unwrap_or(0) as u64;

    let presence_text = match p_type {
        2 => "In Game",
        3 => "In Studio",
        1 => "Online",
        _ => "Offline",
    }
    .to_string();

    log::info!("Request to get user {} succeeded", id);

    Ok(User {
        id,
        display_name: user_info.display_name,
        username: user_info.name,
        avatar_url: thumbs
            .first()
            .map(|t| t.image_url.clone())
            .flatten(),

        presence_type: p_type,
        is_online: p_type > 0,
        presence: presence_text,

        created,
        description,
    })
}
