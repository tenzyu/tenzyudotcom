#[tauri::command]
pub(crate) fn open_path(path: String) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    let command = ("xdg-open", vec![path]);
    #[cfg(target_os = "macos")]
    let command = ("open", vec![path]);
    #[cfg(target_os = "windows")]
    let command = ("cmd", vec!["/C".into(), "start".into(), path]);

    std::process::Command::new(command.0)
        .args(command.1)
        .spawn()
        .map_err(|error| format!("failed to open path: {error}"))?;
    Ok(())
}
