// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    garuda_apps_lib::run();
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
