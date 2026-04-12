use serde::{Deserialize, Serialize};
use uuid::Uuid;
use tauri::AppHandle;

use crate::core::data::roblox_request;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SortEntry {
    pub sort_display_name: Option<String>,
    pub display_name: Option<String>,
    pub game_set_target_id: Option<u64>,
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

    // these are the advanced filters!
    pub cpu: String,
    pub ram: String,
    pub res: String,
    pub net: String,
}

pub async fn fetch_discovery(
    app: AppHandle,
    filters: HardwareFilters,
    page_token: Option<String>,
) -> Result<(Vec<String>, Option<String>), String> {
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

    let raw_response = roblox_request(
        app, 
        "GET".into(), 
        url, 
        None
    ).await?;

    let data: DiscoveryResponse = serde_json::from_str(&raw_response)
        .map_err(|e| format!("Discovery Parse Error: {}", e))?;

    let names = data.sorts
        .into_iter()
        .map(|s| s.sort_display_name.or(s.display_name).unwrap_or_else(|| "Unknown Sort".into()))
        .collect();

    Ok((names, data.next_sorts_page_token))
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
) -> Result<(Vec<String>, Option<String>), String> {
    let filters = HardwareFilters {
        device,
        country,
        cpu,
        ram,
        res,
        net,
    };

    fetch_discovery(app, filters, page_token).await
}