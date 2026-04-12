use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use uuid::Uuid;

use crate::core::data::roblox_request;

pub struct SessionCache {
    pub omni_data: Arc<Mutex<Option<OmniResponse>>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Game {
    pub id: u64,
    pub root_place_id: u64,
    pub name: String,
    pub description: String,
    pub source_name: Option<String>,
    pub source_description: Option<String>,
    pub creator: Creator,
    pub price: Option<u64>,
    pub allowed_gear_genres: Vec<String>,
    pub allowed_gear_categories: Vec<String>,
    pub is_genre_enforced: bool,
    pub copying_allowed: bool,
    pub playing: u64,
    pub visits: u64,
    pub max_players: u32,
    pub created: String,
    pub updated: String,
    pub studio_access_to_apis_allowed: bool,
    pub create_vip_servers_allowed: bool,
    pub universe_avatar_type: String,
    pub genre: String,
    #[serde(rename = "genre_l1")]
    pub genre_l1: String,
    #[serde(rename = "genre_l2")]
    pub genre_l2: String,
    #[serde(rename = "untranslated_genre_l1")]
    pub untranslated_genre_l1: String,
    pub is_all_genre: bool,
    pub is_favorited_by_user: bool,
    pub favorited_count: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Creator {
    pub id: u64,
    pub name: String,
    pub r#type: String,
    pub has_verified_badge: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GameDetails {
    pub universe_id: u64,
    pub name: String,
    pub player_count: Option<u32>,
    pub total_up_votes: Option<u32>,
    pub total_down_votes: Option<u32>,
    pub root_place_id: Option<u64>,
    pub thumbnail: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ContentMetadata {
    #[serde(rename = "Game")]
    pub game: HashMap<String, GameDetails>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RecommendationItem {
    pub content_id: u64,
    pub content_type: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Sort {
    pub topic: Option<String>,
    #[serde(default)]
    pub recommendation_list: Option<Vec<RecommendationItem>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct OmniResponse {
    #[serde(default)]
    pub sorts: Vec<Sort>,
    #[serde(default)]
    pub content_metadata: Option<ContentMetadata>,
}

pub async fn fetch_omni_data(app: tauri::AppHandle) -> Result<OmniResponse, String> {
    let url = "https://apis.roblox.com/discovery-api/omni-recommendation".to_string();

    let payload = json!({
        "pageType": "GameHomePage",
        "sessionId": Uuid::new_v4().to_string(),
        "supportedContexts": ["Universe"]
    })
    .to_string();

    let raw_response = roblox_request(app, "POST".to_string(), url, Some(payload)).await?;

    let data: OmniResponse = serde_json::from_str(&raw_response)
        .map_err(|e| format!("JSON Deserialization failed: {}", e))?;

    Ok(data)
}

pub fn filter_games_by_topic(data: &OmniResponse, search_topic: &str) -> Vec<GameDetails> {
    let search_lower = search_topic.to_lowercase();

    let found_sort = data.sorts.iter().find(|sort| {
        sort.topic
            .as_ref()
            .map(|t| t.to_lowercase().contains(&search_lower))
            .unwrap_or(false)
    });

    match (found_sort, &data.content_metadata) {
        (Some(sort), Some(metadata)) => sort
            .recommendation_list
            .as_ref()
            .map(|list| {
                list.iter()
                    .filter(|item| item.content_type == "Game")
                    .filter_map(|item| {
                        let id_str = item.content_id.to_string();
                        metadata.game.get(&id_str).cloned()
                    })
                    .collect()
            })
            .unwrap_or_default(),
        _ => Vec::new(),
    }
}

pub async fn fetch_thumbnails(
    app: tauri::AppHandle,
    universe_ids: Vec<u64>,
    size: Option<String>,
    t_type: Option<String>,
) -> HashMap<u64, String> {
    let mut all_thumbnails = HashMap::new();
    let thumbnail_type = t_type
        .unwrap_or_else(|| "thumbnail".to_string())
        .to_lowercase();

    let (base_url, default_size) = if thumbnail_type == "icon" {
        ("https://thumbnails.roblox.com/v1/games/icons", "150x150")
    } else {
        (
            "https://thumbnails.roblox.com/v1/games/multiget/thumbnails",
            "768x432",
        )
    };

    let thumbnail_size = size.unwrap_or_else(|| default_size.to_string());

    for chunk in universe_ids.chunks(50) {
        let ids_query = chunk
            .iter()
            .map(|id| id.to_string())
            .collect::<Vec<String>>()
            .join(",");

        let url = format!(
            "{}?universeIds={}&size={}&format=Png&isCircular=false",
            base_url, ids_query, thumbnail_size
        );

        if let Ok(res_body) = roblox_request(app.clone(), "GET".into(), url, None).await {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&res_body) {
                if let Some(data) = json["data"].as_array() {
                    for item in data {
                        let id = item["targetId"]
                            .as_u64()
                            .or_else(|| item["universeId"].as_u64())
                            .unwrap_or(0);

                        let image_url = if thumbnail_type == "icon" {
                            item["imageUrl"].as_str()
                        } else {
                            item["thumbnails"]
                                .as_array()
                                .and_then(|t| t.get(0))
                                .and_then(|first| first["imageUrl"].as_str())
                        }
                        .map(|s| s.to_string());

                        if id != 0 {
                            all_thumbnails.insert(id, image_url.unwrap_or_default());
                        }
                    }
                }
            }
        }
    }
    all_thumbnails
}

#[tauri::command]
pub async fn get_games_by_topic(
    app: tauri::AppHandle,
    cache: tauri::State<'_, SessionCache>,
    topic: String,
    limit: Option<usize>,
    provide_thumbnail: Option<bool>,
    thumbnail_size: Option<String>,
    thumbnail_type: Option<String>,
) -> Result<Vec<GameDetails>, String> {
    let mut cache_lock = cache.omni_data.lock().await;

    let full_data = if let Some(cached) = &*cache_lock {
        cached.clone()
    } else {
        let fresh = fetch_omni_data(app.clone()).await?;

        *cache_lock = Some(fresh.clone());

        fresh
    };

    drop(cache_lock);

    let mut games = filter_games_by_topic(&full_data, &topic);

    if let Some(max) = limit {
        games.truncate(max);
    }

    if provide_thumbnail.unwrap_or(false) && !games.is_empty() {
        let universe_ids: Vec<u64> = games.iter().map(|g| g.universe_id).collect();
        let thumbnail_map =
            fetch_thumbnails(app, universe_ids, thumbnail_size, thumbnail_type).await;

        for game in &mut games {
            game.thumbnail = thumbnail_map.get(&game.universe_id).cloned();
        }
    }

    if games.is_empty() {
        return Err(format!("No games found for topic: {}", topic));
    }

    Ok(games)
}

#[tauri::command]
pub async fn get_game_details(
    app: tauri::AppHandle,
    id: u64,
    get_thumbnail: Option<bool>,
) -> Result<(Game, Option<String>), String> {
    let url = format!("https://games.roblox.com/v1/games?universeIds={}", id);

    let thumbnail = if get_thumbnail.unwrap_or(false) {
        let thumbs = fetch_thumbnails(app.clone(), vec![id], None, None).await;
        thumbs.get(&id).cloned()
    } else {
        None
    };

    let response = roblox_request(app, "GET".to_string(), url, None).await?;

    let json: serde_json::Value = serde_json::from_str(&response)
        .map_err(|e| format!("Failed to parse game details JSON: {}", e))?;

    let game_value = json["data"][0].clone();

    if game_value.is_null() {
        return Err("No game details found for this ID".to_string());
    }

    let details: Game = serde_json::from_value(game_value)
        .map_err(|e| format!("Failed to map JSON to Game struct: {}", e))?;

    Ok((details, thumbnail))
}
