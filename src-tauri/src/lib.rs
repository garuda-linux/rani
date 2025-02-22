use portable_pty::{native_pty_system, CommandBuilder, PtyPair, PtySize};
use std::{
    io::{BufRead, BufReader, Read, Write},
    process::exit,
    sync::Arc,
    thread::{self},
};
use tauri::{async_runtime::Mutex as AsyncMutex, State};

struct AppState {
    pty_pair: Arc<AsyncMutex<PtyPair>>,
    writer: Arc<AsyncMutex<Box<dyn Write + Send>>>,
    reader: Arc<AsyncMutex<BufReader<Box<dyn Read + Send>>>>,
}
#[tauri::command]
// create a shell and add to it the $TERM env variable so we can use clear and other commands
async fn async_create_shell(state: State<'_, AppState>) -> Result<(), String> {
    let mut cmd = CommandBuilder::new("bash");
    cmd.arg("--noprofile");
    cmd.arg("--norc");
    cmd.env("TERM", "xterm-256color");
    cmd.env("PS1", "");

    let mut child = state
        .pty_pair
        .lock()
        .await
        .slave
        .spawn_command(cmd)
        .map_err(|err| err.to_string())?;

    thread::spawn(move || {
        let status = child.wait().unwrap();
        exit(status.exit_code() as i32)
    });
    Ok(())
}

#[tauri::command]
async fn async_write_to_pty(data: &str, state: State<'_, AppState>) -> Result<(), ()> {
    write!(state.writer.lock().await, "{}", data).map_err(|_| ())
}

#[tauri::command]
async fn async_read_from_pty(state: State<'_, AppState>) -> Result<Option<String>, ()> {
    let mut reader = state.reader.lock().await;
    let data = {
        let data = reader.fill_buf().map_err(|_| ())?;
        if data.len() > 0 {
            std::str::from_utf8(data)
                .map(|v| Some(v.to_string()))
                .map_err(|_| ())?
        } else {
            None
        }
    };

    if let Some(data) = &data {
        reader.consume(data.len());
    }

    Ok(data)
}

#[tauri::command]
async fn async_resize_pty(rows: u16, cols: u16, state: State<'_, AppState>) -> Result<(), ()> {
    state
        .pty_pair
        .lock()
        .await
        .master
        .resize(PtySize {
            rows,
            cols,
            ..Default::default()
        })
        .map_err(|_| ())
}

pub fn run() {
    let pty_system = native_pty_system();
    let pty_pair = pty_system
        .openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })
        .unwrap();
    let reader = pty_pair.master.try_clone_reader().unwrap();
    let writer = pty_pair.master.take_writer().unwrap();

    tauri::Builder::default()
        .manage(AppState {
            pty_pair: Arc::new(AsyncMutex::new(pty_pair)),
            writer: Arc::new(AsyncMutex::new(writer)),
            reader: Arc::new(AsyncMutex::new(BufReader::new(reader))),
        })
        .invoke_handler(tauri::generate_handler![
            async_write_to_pty,
            async_resize_pty,
            async_create_shell,
            async_read_from_pty,
        ])
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .clear_targets()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Webview,
                ))
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Stdout,
                ))
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("logs".to_string()),
                    },
                ))
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
                .build(),
        )
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_clipboard::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_system_info::init())
        .plugin(tauri_plugin_network::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
