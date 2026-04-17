use std::vec;

use serde::{Deserialize, Serialize};
use uuid::Uuid;
use tauri::AppHandle;
use crate::core::data::roblox_request;
use crate::mapping::game::fetch_thumbnails;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GameEntry {
    pub name: String,
    pub universe_id: u64,
    pub place_id: Option<u64>,
    pub player_count: Option<u64>,
    pub total_up_votes: Option<u64>,
    pub total_down_votes: Option<u64>,
    #[serde(default)]
    pub thumbnail: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FilterOption {
    pub option_display_name: String,
    pub option_id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Filter {
    pub filter_display_name: String,
    pub filter_id: String,
    pub filter_type: String,
    pub selected_option_id: String,
    pub filter_options: Vec<FilterOption>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SortEntry {
    pub sort_display_name: Option<String>,
    pub display_name: Option<String>,
    pub game_set_target_id: Option<u64>,
    pub content_type: Option<String>,
    pub filters: Option<Vec<Filter>>,
    #[serde(default)]
    pub games: Vec<GameEntry>,
}
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveryResponse {
    pub sorts: Vec<SortEntry>,
    pub next_sorts_page_token: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct HardwareFilters {
    pub device: String,
    pub country: String,
    pub cpu: String,
    pub ram: String,
    pub res: String,
    pub net: String,
}

pub async fn fetch_discovery(
    app: AppHandle,
    filters: HardwareFilters,
    page_token: Option<String>,
) -> Result<(Vec<SortEntry>, Option<String>, Option<Vec<Filter>>), String> {
    let base_url = "https://apis.roblox.com/explore-api/v1/get-sorts";

    let mut params = vec![
        ("device", filters.device),
        ("country", filters.country),
        ("cpuCores", filters.cpu),
        ("maxMemory", filters.ram),
        ("maxResolution", filters.res),
        ("networkType", filters.net),
        ("sessionId", Uuid::new_v4().to_string()),
    ];

    if let Some(token) = page_token {
        params.push(("sortsPageToken", token));
    }

    let query_string = params
        .iter()
        .map(|(k, v)| format!("{}={}", k, v))
        .collect::<Vec<_>>()
        .join("&");

    let url = format!("{}?{}", base_url, query_string);

    let raw_response = roblox_request(app.clone(), "GET".into(), url, None).await?;

    let mut data: DiscoveryResponse = serde_json::from_str(&raw_response)
        .map_err(|e| format!("Discovery Parse Error: {}", e))?;

    let extracted_filters = data.sorts.get(0).and_then(|first_sort| {
        if first_sort.content_type.as_deref() == Some("Filters") {
            first_sort.filters.clone()
        } else {
            None
        }
    });

    let mut universe_ids: Vec<u64> = data.sorts
        .iter()
        .flat_map(|s| s.games.iter().map(|g| g.universe_id))
        .collect();
    
    universe_ids.sort();
    universe_ids.dedup();

    if !universe_ids.is_empty() {
        let thumbnails = fetch_thumbnails(
            app, 
            universe_ids, 
            Some("150x150".into()), 
            Some("icon".into())
        ).await;

        for sort in &mut data.sorts {
            for game in &mut sort.games {
                if let Some(url) = thumbnails.get(&game.universe_id) {
                    game.thumbnail = url.clone();
                }
            }
        }
    }

    Ok((data.sorts, data.next_sorts_page_token, extracted_filters))
}

#[tauri::command]
pub async fn get_discovery_sorts(
    app: AppHandle,
    device: String,
    country: String,
    cpu: String,
    ram: String,
    res: String,
    net: String,
    page_token: Option<String>,
) -> Result<(Vec<SortEntry>, Option<String>, Option<Vec<Filter>>), String> {
    let filters = HardwareFilters { device, country, cpu, ram, res, net };
    fetch_discovery(app, filters, page_token).await
}