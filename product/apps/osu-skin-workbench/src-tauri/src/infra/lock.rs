use std::fs::{self, File, OpenOptions, TryLockError};
use std::path::Path;

use super::paths::{managed_dir, open_managed_file};

pub(crate) const WORKBENCH_BUSY: &str =
    "Workbench files are busy. Retry after the other operation finishes.";
const LOCK_FILE: &str = ".workbench.lock";

pub(crate) fn lock_workbench(app_data: &Path) -> Result<File, String> {
    let root = managed_dir(app_data.to_path_buf())?;
    fs::create_dir_all(&root).map_err(|error| format!("failed to create app data dir: {error}"))?;
    let mut options = OpenOptions::new();
    options.read(true).write(true).create(true).truncate(false);
    let (file, _) = open_managed_file(&root.join(LOCK_FILE), &mut options)
        .map_err(|error| format!("failed to open workbench lock: {error}"))?;
    match file.try_lock() {
        Ok(()) => Ok(file),
        Err(TryLockError::WouldBlock) => Err(WORKBENCH_BUSY.into()),
        Err(TryLockError::Error(error)) => Err(format!("failed to lock workbench files: {error}")),
    }
}
