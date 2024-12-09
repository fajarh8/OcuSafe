// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri::{CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem, Window};
use auto_launch::AutoLaunch;
use process_path::get_executable_path;

// define the payload struct
#[derive(Clone, serde::Serialize)]
struct Payload {
    time: i32,
    message: String
}

#[derive(Clone, serde::Serialize)]
struct Done {
    message: bool,
}

// #[derive(Clone, serde::Serialize)]
// struct History {
//     date: String,
//     time: String,
//     duration: String,
//     rest: bool
// }

// #[tauri::command]
// fn send_history(tanggal: String, waktu: String, durasi: String, istirahat: bool, window: Window) {
//     History {date: tanggal, time: waktu, duration: durasi, rest: istirahat};
//     window.emit_all("history-send", History.into());
// }

#[tauri::command]
fn done_verification(is_done: bool, window: Window) {
    window.emit_all("done-verification", Done { message: is_done.into() }).unwrap();
}

#[tauri::command]
fn send_timer(notification_time: i32, window: Window, message: String) {
    window.emit_all("timer-send", 
    Payload {
        time: notification_time.into(),
        message: message
    }).unwrap();
}

#[tauri::command]
fn get_uptime() -> f64 {
    let ut_sec: f64;
    match uptime_lib::get() {
        Ok(uptime) => {
            ut_sec = uptime.as_secs_f64();
        }
        Err(err) => {
            eprintln!("{}", err);
            ut_sec = 0.0;
        }
    }
    ut_sec.into()
}

#[tauri::command]
fn close_window(window: Window) {
    window.close().unwrap();
}

#[tauri::command]
fn auto_launch(status: bool) {
    let path = get_executable_path();
    
    let app_name = "OcuSafe";
    let app_path = path.expect("Convertion Failed").into_os_string().into_string().unwrap();
    let auto = AutoLaunch::new(app_name, &app_path, &[] as &[&str]);

    if status == true {
        // enable the auto launch
        auto.enable().unwrap();
    } else if status == false {
        // disable the auto launch
        auto.disable().unwrap();
    }
    println!("{}, {}", auto.is_enabled().unwrap().to_string(), &app_path);
}

fn main() {
    // here `"quit".to_string()` defines the menu item id, and the second parameter is the menu item label.
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    let show = CustomMenuItem::new("show".to_string(), "Show");
    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(hide)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);
    let tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
    // This is where you pass in your commands
    .system_tray(tray)
    .on_system_tray_event(|app, event| match event {
        SystemTrayEvent::LeftClick {
            position: _,
            size: _,
            ..
        } => {
            let window = app.get_window("main").unwrap();
            window.unminimize().unwrap();
            window.show().unwrap();
            window.set_focus().unwrap();
        }
        SystemTrayEvent::MenuItemClick { id, .. } => {
            match id.as_str() {
                "quit" => {
                    tauri::AppHandle::exit(app, 0);
                }
                "show" => {
                    let window = app.get_window("main").unwrap();
                    window.unminimize().unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
                "hide" => {
                    let window = app.get_window("main").unwrap();
                    window.hide().unwrap();
                }
                _ => {}
            }
        }
          _ => {}
    })
    .invoke_handler(tauri::generate_handler![get_uptime, close_window, send_timer, auto_launch, done_verification])
    .build(tauri::generate_context!())
    .expect("failed to run app")
    .run(|_app_handle, event| match event {
        tauri::RunEvent::ExitRequested { api, .. } => {
            api.prevent_exit();
        }
        _ => {}
    });
}