use tauri::Manager;

pub fn run() {
    // https://github.com/tauri-apps/tauri/issues/9394, thanks Nvidia
    #[cfg(target_os = "linux")]
    {
        let product_name_file = std::path::Path::new("/sys/devices/virtual/dmi/id/product_name");
        let is_wayland = std::env::var("WAYLAND_DISPLAY").is_ok();

        unsafe {
            log::info!("Disabling WebKit DMABuf renderer, WebkitGTK seems to be a massive pile of buggy code garbage??");
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }

        // https://www.reddit.com/r/tauri/comments/16tzsi8/tauri_desktop_app_not_rendering_but_web_does
        if std::path::Path::new("/proc/driver/nvidia/version").exists() {
            // SAFETY: There's potential for race conditions in a multi-threaded context
            unsafe {
                log::info!("Nvidia GPU detected, disabling compositing mode");
                std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
            }
        }

        // If using VMWare/VirtualBox on WAYLAND, disable the DMABuf renderer
        if is_wayland && product_name_file.exists() {
            let product_name = std::fs::read_to_string(product_name_file).unwrap();
            if product_name.to_lowercase().contains("virtualbox")
                || product_name.to_lowercase().contains("vmware")
            {
                // SAFETY: There's potential for race conditions in a multi-threaded context
                unsafe {
                    log::info!("VirtualBox/VMWare detected, disabling WebKit DMABuf renderer");
                    std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
                }
            }
        }
    }

    let builder = tauri::Builder::default();
    builder
        .setup(|app| {
            // Create the log plugin as usual, but call split() instead of build()
            // this effectively prevents a panic due to multiple logger implementations
            let (tauri_plugin_log, max_level, logger) = tauri_plugin_log::Builder::new()
                .max_file_size(10_000_000)
                .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal)
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepOne)
                .split(app.handle())?;

            // On release builds, only attach the logger from tauri-plugin-log
            #[cfg(not(debug_assertions))]
            {
                tauri_plugin_log::attach_logger(max_level, logger);
            }

            #[cfg(debug_assertions)]
            {
                // Open the DevTools window in debug builds
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
                window.close_devtools();

                // On debug builds, set up the DevTools plugin and pipe the logger from tauri-plugin-log
                let mut devtools_builder = tauri_plugin_devtools::Builder::default();
                devtools_builder.attach_logger(logger);
                app.handle().plugin(devtools_builder.init())?;
            }

            #[cfg(desktop)]
            let _ = app.handle().plugin(tauri_plugin_autostart::init(
                tauri_plugin_autostart::MacosLauncher::LaunchAgent,
                Some(vec![]),
            ));

            app.handle().plugin(tauri_plugin_log)?;

            Ok(())
        })
        .plugin(tauri_plugin_prevent_default::init())
        .plugin(tauri_plugin_cli::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_clipboard::init())
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("Error while running tauri application");
}
