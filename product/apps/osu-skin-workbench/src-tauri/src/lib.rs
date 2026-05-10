mod commands;
mod domain;
mod infra;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::project::health_check,
            commands::project::list_projects,
            commands::project::create_project,
            commands::project::rename_project,
            commands::project::delete_project,
            commands::project::add_project_source,
            commands::project::rename_project_source,
            commands::project::delete_project_source,
            commands::project::get_project_files,
            commands::project::rebuild_structured_mirrors,
            commands::assets::apply_asset_group,
            commands::assets::delete_asset_group,
            commands::export::export_project,
            commands::system::open_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running osu! Skin Workbench");
}
