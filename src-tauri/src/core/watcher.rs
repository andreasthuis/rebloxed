use linemux::MuxedLines;
use regex::Regex;
use std::path::{Path, PathBuf};
use std::time::Duration;
use tokio::sync::broadcast;
use serde_json::Value;
use serde::{Serialize, Deserialize};

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct ActivityData {
    pub place_id: i64,
    pub universe_id: i64,
    pub job_id: String,
    pub user_id: i64,
    pub in_game: bool,
}

#[derive(Clone, Debug)]
pub enum WatcherEvent {
    GameJoined(ActivityData),
    GameLeft,
    RPCMessage(Value),
}

#[derive(Clone)]
pub struct ActivityWatcher {
    pub tx: broadcast::Sender<WatcherEvent>,
}

impl ActivityWatcher {
    pub fn new() -> (Self, broadcast::Receiver<WatcherEvent>) {
        let (tx, rx) = broadcast::channel(32);
        (Self { tx }, rx)
    }

    pub async fn start(&self) -> Result<(), Box<dyn std::error::Error>> {
        let log_path = self.get_roblox_log_path()?;

        if !log_path.exists() {
            return Err(format!("Log path does not exist: {:?}", log_path).into());
        }

        let log_file = if log_path.is_dir() {
            let latest = self.find_latest_log(&log_path).await?;
            println!("Tailing latest log file: {:?}", latest);
            latest
        } else {
            println!("Tailing log file: {:?}", log_path);
            log_path
        };

        let mut lines = MuxedLines::new()?;
        lines.add_file(&log_file).await?;

        let re_joining = Regex::new(
            r"! Joining game '(?P<job>[0-9a-f\-]{36})' place (?P<place>[0-9]+)"
        )?;

        let re_universe = Regex::new(
            r"universeid:(?P<univ>[0-9]+).*userid:(?P<user>[0-9]+)"
        )?;

        let re_rpc = Regex::new(
            r"\[BloxstrapRPC\] (?P<json>.*)"
        )?;

        let mut current_data = ActivityData::default();

        while let Ok(Some(line)) = lines.next_line().await {
            let entry = line.line();

            let log_message = match entry.split_once(' ') {
                Some((_, msg)) => msg,
                None => entry,
            };

            if let Some(caps) = re_joining.captures(log_message) {
                current_data.job_id = caps["job"].to_string();
                current_data.place_id = caps["place"].parse().unwrap_or(0);
                current_data.in_game = false;
            }

            if let Some(caps) = re_universe.captures(log_message) {
                current_data.universe_id = caps["univ"].parse().unwrap_or(0);
                current_data.user_id = caps["user"].parse().unwrap_or(0);
            }

            if log_message.contains("[FLog::Network] Replicator created:") {
                current_data.in_game = true;
                let _ = self.tx.send(WatcherEvent::GameJoined(current_data.clone()));
            }

            if let Some(caps) = re_rpc.captures(log_message) {
                if let Ok(json_val) = serde_json::from_str::<Value>(&caps["json"]) {
                    let _ = self.tx.send(WatcherEvent::RPCMessage(json_val));
                }
            }

            if log_message.contains("[FLog::Network] Time to disconnect replication data:") {
                current_data = ActivityData::default();
                let _ = self.tx.send(WatcherEvent::GameLeft);
            }
        }

        Ok(())
    }

    fn get_roblox_log_path(&self) -> Result<PathBuf, String> {
        if cfg!(target_os = "windows") {
            dirs::data_local_dir()
                .map(|p| p.join("Roblox").join("logs"))
                .ok_or_else(|| "Could not locate Windows LocalAppData".to_string())

        } else if cfg!(target_os = "macos") {
            dirs::home_dir()
                .map(|p| p.join("Library").join("Logs").join("Roblox"))
                .ok_or_else(|| "Could not locate macOS Home Directory".to_string())

        } else if cfg!(target_os = "linux") {
            let home = dirs::home_dir()
                .ok_or("Could not locate Linux Home Directory")?;

            // Sober
            let sober_log = home
                .join(".var")
                .join("app")
                .join("org.vinegarhq.Sober")
                .join("data")
                .join("sober")
                .join("sober_logs")
                .join("latest.log");

            if sober_log.exists() {
                return Ok(sober_log);
            }

            // fallback
            let sober_dir = home
                .join(".var")
                .join("app")
                .join("org.vinegarhq.Sober")
                .join("data")
                .join("sober")
                .join("sober_logs");

            if sober_dir.exists() {
                return Ok(sober_dir);
            }

            Err("Could not find a valid Roblox log path on Linux (Sober not found).".to_string())
        } else {
            Err("Unsupported Operating System".to_string())
        }
    }

    async fn find_latest_log(&self, path: &Path) -> Result<PathBuf, String> {
        loop {
            if let Ok(entries) = std::fs::read_dir(path) {
                let mut logs: Vec<_> = entries
                    .filter_map(|e| e.ok())
                    .filter(|e| {
                        let name = e.file_name().to_string_lossy().to_lowercase();
                        (name.contains("player") || name.contains("log-"))
                            && name.ends_with(".log")
                    })
                    .collect();

                logs.sort_by_key(|a| {
                    a.metadata()
                        .and_then(|m| m.modified())
                        .ok()
                });

                logs.reverse();

                if let Some(newest) = logs.first() {
                    let metadata = newest.metadata().map_err(|e| e.to_string())?;
                    let modified = metadata.modified().map_err(|e| e.to_string())?;

                    if modified.elapsed().unwrap_or(Duration::from_secs(999))
                        < Duration::from_secs(30)
                    {
                        return Ok(newest.path());
                    }
                }
            }

            tokio::time::sleep(Duration::from_secs(2)).await;
        }
    }
}