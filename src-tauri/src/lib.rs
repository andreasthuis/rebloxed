pub mod core;
pub mod api;

use core::auth::{get_authenticated_user, login_with_cookie};
use core::data::roblox_request;
use core::play::launch_roblox;
use api::user::get_user;

/// Standard Tauri greet command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("logs".to_string()),
                    },
                ))
                .build(),
        )
        .plugin(tauri_plugin_keyring::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_keyring::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            launch_roblox,
            login_with_cookie,
            get_authenticated_user,
            roblox_request,
            get_user,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
