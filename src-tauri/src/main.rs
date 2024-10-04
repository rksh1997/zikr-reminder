// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayHandle, SystemTrayMenu,
    SystemTrayMenuItem,
};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};

fn disable_menu_item_and_enable_others(tray_handle: &SystemTrayHandle, id: &str) {
    let ids = ["5_min", "15_min", "30_min", "60_min"];
    for item_id in &ids {
        let item = tray_handle.get_item(item_id);
        if id == *item_id {
            item.set_enabled(false).unwrap();
        } else {
            item.set_enabled(true).unwrap();
        }
    }
}

fn main() {
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("5_min".to_string(), "Every 5 minutes").disabled())
        .add_item(CustomMenuItem::new(
            "15_min".to_string(),
            "Every 15 minutes",
        ))
        .add_item(CustomMenuItem::new(
            "30_min".to_string(),
            "Every 30 minutes",
        ))
        .add_item(CustomMenuItem::new("60_min".to_string(), "Every hour"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new(
            "toggle_autolaunch".to_string(),
            "Enable autostart",
        ))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("quit".to_string(), "Quit"));

    let tray = SystemTray::new().with_menu(tray_menu);

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .setup(|app| {
            // Only set activation policy on macOS
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            if app.autolaunch().is_enabled().unwrap() {
                let _ = app
                    .tray_handle()
                    .get_item("toggle_autolaunch")
                    .set_title("Disable autostart");
            }

            let window = app.get_window("main").unwrap();
            window.hide().unwrap();

            Ok(())
        })
        .system_tray(tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => {
                    std::process::exit(0);
                }
                "5_min" => {
                    let _ = app.emit_all("interval_changed", 5);
                    disable_menu_item_and_enable_others(&app.tray_handle(), "5_min");
                }
                "15_min" => {
                    let _ = app.emit_all("interval_changed", 15);
                    disable_menu_item_and_enable_others(&app.tray_handle(), "15_min");
                }
                "30_min" => {
                    let _ = app.emit_all("interval_changed", 30);
                    disable_menu_item_and_enable_others(&app.tray_handle(), "30_min");
                }
                "60_min" => {
                    let _ = app.emit_all("interval_changed", 60);
                    disable_menu_item_and_enable_others(&app.tray_handle(), "60_min");
                }
                "toggle_autolaunch" => {
                    let is_enabled = app.autolaunch().is_enabled().unwrap();
                    if is_enabled {
                        let _ = app
                            .tray_handle()
                            .get_item("toggle_autolaunch")
                            .set_title("Enable autostart");
                        let _ = app.autolaunch().disable();
                    } else {
                        let _ = app
                            .tray_handle()
                            .get_item("toggle_autolaunch")
                            .set_title("Disable autostart");
                        let _ = app.autolaunch().enable();
                    }
                }
                _ => {}
            },
            _ => {}
        })
        .run(tauri::generate_context!());

    if let Err(e) = app {
        eprintln!("Error while running tauri application: {}", e);
    }
}
