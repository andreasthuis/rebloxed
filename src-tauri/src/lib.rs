use tauri::Emitter;
use tauri_plugin_log::log;

pub mod core;
pub mod mapping;

use core::auth::{get_authenticated_user, login_with_cookie, wait_for_login};
use core::data::roblox_request;
use core::play::launch_roblox;
use mapping::friends::get_user_friends;
use mapping::game::{get_game_details, get_games_by_topic};
use mapping::user::get_user;

use core::watcher::{ActivityWatcher, WatcherEvent};

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
        .setup(|app| {
            let handle = app.handle().clone();

            tauri::async_runtime::spawn(async move {
                let (watcher, mut rx) = ActivityWatcher::new();
                let watcher_for_task = watcher.clone();

                tauri::async_runtime::spawn(async move {
                    if let Err(e) = watcher_for_task.start().await {
                        log::error!("ActivityWatcher error: {}", e);
                    }
                });

                log::info!("Log Watcher successfully initialized.");

                while let Ok(event) = rx.recv().await {
                    match event {
                        WatcherEvent::GameJoined(data) => {
                            let _ = handle.emit("roblox-joined", data);
                            log::info!("Joined game");
                        }
                        WatcherEvent::GameLeft => {
                            let _ = handle.emit("roblox-left", ());
                            log::info!("Left game");
                        }
                        WatcherEvent::RPCMessage(json) => {
                            log::info!("RPC: {}", json);
                        }
                    }
                }
            });

            Ok(())
        })
        .plugin(tauri_plugin_keyring::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![
            launch_roblox,
            login_with_cookie,
            get_authenticated_user,
            roblox_request,
            get_user,
            wait_for_login,
            get_games_by_topic,
            get_user_friends,
            get_game_details
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
