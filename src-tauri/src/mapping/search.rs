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
pub struct SortEntry {
    pub sort_display_name: Option<String>,
    pub display_name: Option<String>,
    pub game_set_target_id: Option<u64>,
    pub content_type: Option<String>,
    pub filters: Option<Vec<Filter>>,
    #[serde(default)]
    pub games: Vec<GameEntry>,
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
pub struct FilterOption {
    pub option_display_name: String,
    pub option_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SearchContent {
    name: String,
    universe_id: u64,
    root_place_id: Option<u64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SearchResult {
    topic: String,
    contents: Vec<SearchContent>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct OmniSearchResponse {
    search_results: Vec<SearchResult>,
    next_page_token: Option<String>,
}

#[tauri::command]
pub async fn search_game(
    app: AppHandle,
    name: String,
    page_token: Option<String>,
) -> Result<(Vec<SortEntry>, Option<String>), String> {
    let base_url = "https://apis.roblox.com/search-api/omni-search";

    let mut params = vec![
        ("searchQuery", name),
        ("sessionId", Uuid::new_v4().to_string()),
        ("pageType", "all".to_string()),
    ];

    if let Some(token) = page_token {
        if !token.is_empty() {
            params.push(("pageToken", token));
        }
    }

    let query_string = params
        .iter()
        .map(|(k, v)| format!("{}={}", k, v))
        .collect::<Vec<_>>()
        .join("&");

    let url = format!("{}?{}", base_url, query_string);

    let raw_response = roblox_request(app.clone(), "GET".into(), url, None).await?;

    let data: OmniSearchResponse = serde_json::from_str(&raw_response)
        .map_err(|e| format!("Search Parse Error: {}", e))?;

    let mut universe_ids: Vec<u64> = data.search_results
        .iter()
        .flat_map(|res| res.contents.iter().map(|c| c.universe_id))
        .collect();

    universe_ids.sort();
    universe_ids.dedup();

    let mut game_sorts: Vec<SortEntry> = Vec::new();

    if !universe_ids.is_empty() {
        let thumbnails = fetch_thumbnails(
            app,
            universe_ids,
            None,
            None
        ).await;

        for result in data.search_results {
            let games = result.contents.into_iter().map(|c| {
                GameEntry {
                    name: c.name,
                    universe_id: c.universe_id,
                    place_id: c.root_place_id,
                    player_count: None,
                    total_up_votes: None,
                    total_down_votes: None,
                    thumbnail: thumbnails.get(&c.universe_id).cloned().unwrap_or_default(),
                }
            }).collect();

            game_sorts.push(SortEntry {
                sort_display_name: Some(result.topic),
                display_name: None,
                game_set_target_id: None,
                content_type: Some("Game".into()),
                filters: None,
                games,
            });
        }
    }

    Ok((game_sorts, data.next_page_token))
}