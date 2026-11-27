use super::*;
use crate::commands::project::rename_project_at;
use crate::infra::lock::WORKBENCH_BUSY;
use std::cell::{Cell, RefCell};
use std::collections::BTreeMap;
use std::fs::File;
use std::io::{self, Read, Seek, SeekFrom, Write};
use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::{Mutex, MutexGuard};
use std::time::{Duration, Instant};
use tempfile::TempDir;
use zip::write::SimpleFileOptions;
use zip::{CompressionMethod, ZipArchive, ZipWriter};

const ID: &str = "Legacy Skin.v1";
const MANIFEST: &[u8] = br#"{
    "id": "Legacy Skin.v1",
    "name": "Fixture Skin",
    "mainSourcePath": "unused-synthetic-import",
    "createdAt": "2000-01-01T00:00:00Z",
    "updatedAt": "2000-01-01T00:00:00Z",
    "sources": []
}"#;
const WORKING: &[(&str, &[u8])] = &[
    ("effects/hit.png", b"new SD"),
    ("effects/hit@2X.png", b"unchanged HD"),
    ("new.txt", b""),
    ("size.txt", b"longer"),
    ("skin.ini", b"[General]\nName: Fixture\n"),
];
const MAIN: &[(&str, &[u8])] = &[
    ("effects/hit.png", b"old SD"),
    ("effects/hit@2X.png", b"unchanged HD"),
    ("removed.txt", b"baseline only"),
    ("size.txt", b"x"),
    ("skin.ini", b"[General]\nName: Fixture\n"),
];
const PROJECT_FILES: &[(&str, &[u8])] = &[
    ("manifest.json", MANIFEST),
    ("project/structured/mirror.png", b"working mirror"),
    ("sources/main/structured/mirror.png", b"source mirror"),
    ("sources/reference/raw/ref.png", b"reference snapshot"),
    ("sources/reference/structured/ref.png", b"reference mirror"),
];
const OLD_ZIP: &[(&str, &[u8])] = &[("old.txt", b"earlier archive")];
type ZipContents = BTreeMap<String, Vec<u8>>;

// A fork can briefly inherit locks from another test until the child execs.
static FIXTURE_LOCK: Mutex<()> = Mutex::new(());

struct Fixture {
    temp: TempDir,
    app_data: PathBuf,
    project: PathBuf,
    working: PathBuf,
    main: PathBuf,
    exports: PathBuf,
    _guard: MutexGuard<'static, ()>,
}

impl Fixture {
    fn new() -> Self {
        let guard = FIXTURE_LOCK
            .lock()
            .unwrap_or_else(|error| error.into_inner());
        let temp = tempfile::Builder::new()
            .prefix("workbench-export-test-")
            .tempdir()
            .unwrap();
        let app_data = temp.path().join("app-data");
        let project = app_data.join("skin-editor-projects").join(ID);
        let working = project.join("project/raw");
        let main = project.join("sources/main/raw");
        let exports = app_data.join("exports").join(ID);
        put_files(&project, PROJECT_FILES);
        put_files(&working, WORKING);
        put_files(&main, MAIN);
        Self {
            _guard: guard,
            temp,
            app_data,
            project,
            working,
            main,
            exports,
        }
    }

    fn export(&self, preset: ExportPreset) -> Result<ExportResult, String> {
        export_at(&self.app_data, input(ID, preset))
    }

    fn output(&self, preset: ExportPreset) -> PathBuf {
        self.exports.join(preset.file_name(ID))
    }

    fn seed_outputs(&self) {
        put_files(&self.exports, &[("keep-me.txt", b"user-owned sentinel")]);
        for preset in ExportPreset::ALL {
            let mut writer = ZipWriter::new(File::create(self.output(preset)).unwrap());
            let options =
                SimpleFileOptions::default().compression_method(CompressionMethod::Deflated);
            writer.start_file(OLD_ZIP[0].0, options).unwrap();
            writer.write_all(OLD_ZIP[0].1).unwrap();
            writer.finish().unwrap();
        }
    }

    fn assert_export(&self, preset: ExportPreset, expected: ZipContents, excluded: usize) {
        let result = self.export(preset).unwrap();
        assert_eq!(result.preset.file_name(ID), preset.file_name(ID));
        assert_eq!(Path::new(&result.output_path), self.output(preset));
        assert_eq!(result.file_count, expected.len());
        assert_eq!(result.excluded_count, excluded);
        assert_eq!(read_zip(File::open(result.output_path).unwrap()), expected);
    }

    fn assert_only_replaced(&self, preset: ExportPreset, before: &ZipContents) {
        let replaced = preset.file_name(ID);
        let mut after = output_bytes(&self.exports);
        assert_eq!(
            after.keys().collect::<Vec<_>>(),
            before.keys().collect::<Vec<_>>()
        );
        let previous = before[&replaced].clone();
        after.insert(replaced, previous);
        assert_eq!(&after, before);
    }
}

fn input(id: &str, preset: ExportPreset) -> ExportProjectInput {
    ExportProjectInput {
        project_id: id.into(),
        preset,
    }
}

fn put_files(root: &Path, files: &[(&str, &[u8])]) {
    for (name, bytes) in files {
        let path = root.join(name);
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(path, bytes).unwrap();
    }
}

fn entries(files: &[(&str, &[u8])]) -> ZipContents {
    files
        .iter()
        .map(|(name, bytes)| ((*name).into(), bytes.to_vec()))
        .collect()
}

fn read_zip(file: File) -> ZipContents {
    let mut archive = ZipArchive::new(file).unwrap();
    let mut contents = ZipContents::new();
    for index in 0..archive.len() {
        let mut entry = archive.by_index(index).unwrap();
        assert!(entry.is_file());
        assert!(entry.enclosed_name().is_some());
        assert_eq!(entry.compression(), CompressionMethod::Deflated);
        let mut bytes = Vec::new();
        entry.read_to_end(&mut bytes).unwrap();
        assert!(contents.insert(entry.name().unwrap().into_owned(), bytes).is_none());
    }
    contents
}

fn output_bytes(dir: &Path) -> ZipContents {
    fs::read_dir(dir)
        .unwrap()
        .map(|entry| {
            let entry = entry.unwrap();
            (
                entry.file_name().into_string().unwrap(),
                fs::read(entry.path()).unwrap(),
            )
        })
        .collect()
}

#[test]
fn all_presets_keep_other_archives_and_user_files() {
    let f = Fixture::new();
    f.seed_outputs();

    let mut backup = entries(PROJECT_FILES);
    for (prefix, files) in [("project/raw", WORKING), ("sources/main/raw", MAIN)] {
        for (name, bytes) in files {
            backup.insert(format!("{prefix}/{name}"), bytes.to_vec());
        }
    }
    let before = output_bytes(&f.exports);
    f.assert_export(ExportPreset::Backup, backup, 0);
    f.assert_only_replaced(ExportPreset::Backup, &before);

    let before = output_bytes(&f.exports);
    f.assert_export(ExportPreset::Full, entries(WORKING), 0);
    f.assert_only_replaced(ExportPreset::Full, &before);

    let before = output_bytes(&f.exports);
    f.assert_export(
        ExportPreset::Diff,
        entries(&[
            ("effects/hit.png", b"new SD"),
            ("new.txt", b""),
            ("size.txt", b"longer"),
        ]),
        2,
    );
    f.assert_only_replaced(ExportPreset::Diff, &before);

    let before = output_bytes(&f.exports);
    put_files(&f.working, &[("effects/hit.png", b"latest SD")]);
    let mut working = entries(WORKING);
    working.insert("effects/hit.png".into(), b"latest SD".to_vec());
    f.assert_export(ExportPreset::Full, working.clone(), 0);
    f.assert_only_replaced(ExportPreset::Full, &before);

    let before = output_bytes(&f.exports);
    let hd = working.remove("effects/hit@2X.png").unwrap();
    f.assert_export(ExportPreset::SdOnly, working, 1);
    f.assert_only_replaced(ExportPreset::SdOnly, &before);

    let before = output_bytes(&f.exports);
    f.assert_export(
        ExportPreset::HdOnly,
        entries(&[("effects/hit@2X.png", &hd)]),
        4,
    );
    f.assert_only_replaced(ExportPreset::HdOnly, &before);
}

#[test]
fn empty_selections_and_legacy_backup_without_optional_trees() {
    let f = Fixture::new();
    for root in [&f.working, &f.main] {
        fs::remove_dir_all(root).unwrap();
        put_files(root, &[("skin.ini", b"same")]);
    }
    f.assert_export(ExportPreset::Diff, ZipContents::new(), 1);
    f.assert_export(ExportPreset::HdOnly, ZipContents::new(), 1);
    fs::remove_dir_all(f.project.join("project")).unwrap();
    fs::remove_dir_all(f.project.join("sources")).unwrap();
    f.assert_export(
        ExportPreset::Backup,
        entries(&[("manifest.json", MANIFEST)]),
        0,
    );
}

#[test]
fn diff_compares_equal_length_files_past_the_first_buffer() {
    let f = Fixture::new();
    let original = vec![b'x'; 128 * 1024];
    let mut changed = original.clone();
    *changed.last_mut().unwrap() = b'y';
    for path in [&f.main, &f.working] {
        fs::remove_dir_all(path).unwrap();
        put_files(path, &[("same", &original)]);
    }
    put_files(&f.main, &[("changed", &original)]);
    put_files(&f.working, &[("changed", &changed)]);
    f.assert_export(ExportPreset::Diff, entries(&[("changed", &changed)]), 1);
}

#[test]
fn invalid_ids_and_missing_or_mismatched_inputs_leave_outputs_untouched() {
    let f = Fixture::new();
    for id in [
        "",
        ".",
        "..",
        "a/b",
        "a\\b",
        "../outside",
        "C:drive",
        "aux.legacy",
        "id.",
        "id ",
    ] {
        let error = export_at(&f.app_data, input(id, ExportPreset::Full)).unwrap_err();
        assert!(error.contains("path component"), "{id:?}: {error}");
    }
    let missing = export_at(&f.app_data, input("missing", ExportPreset::Backup)).unwrap_err();
    assert!(missing.contains("open manifest"), "{missing}");

    fs::remove_dir_all(&f.main).unwrap();
    assert!(f
        .export(ExportPreset::Diff)
        .unwrap_err()
        .contains("required directory"));
    fs::remove_dir_all(&f.working).unwrap();
    assert!(f
        .export(ExportPreset::Full)
        .unwrap_err()
        .contains("required directory"));
    assert!(!f.app_data.join("exports").exists());

    f.seed_outputs();
    let before = output_bytes(&f.exports);
    fs::write(
        f.project.join("manifest.json"),
        std::str::from_utf8(MANIFEST)
            .unwrap()
            .replace(ID, "Other Skin"),
    )
    .unwrap();
    for preset in ExportPreset::ALL {
        assert!(f.export(preset).unwrap_err().contains("manifest ID"));
    }
    assert_eq!(output_bytes(&f.exports), before);
}

#[test]
fn diff_io_error_keeps_previous_zip() {
    let f = Fixture::new();
    f.seed_outputs();
    let before = output_bytes(&f.exports);
    let counterpart = f.main.join("effects/hit.png");
    fs::remove_file(&counterpart).unwrap();
    fs::create_dir(&counterpart).unwrap();
    let error = f.export(ExportPreset::Diff).unwrap_err();
    assert!(error.contains("expected a regular file"), "{error}");
    assert!(error.contains("hit.png"), "{error}");
    assert_eq!(output_bytes(&f.exports), before);
    assert_eq!(
        read_zip(File::open(f.output(ExportPreset::Diff)).unwrap()),
        entries(OLD_ZIP)
    );
}

#[cfg(target_os = "linux")]
#[test]
fn unsafe_and_case_colliding_names_keep_previous_zip() {
    let f = Fixture::new();
    f.seed_outputs();
    let before = output_bytes(&f.exports);
    put_files(&f.working, &[("z\\ambiguous.txt", b"unsafe")]);
    let error = f.export(ExportPreset::Full).unwrap_err();
    assert!(error.contains("invalid path component"), "{error}");
    assert_eq!(output_bytes(&f.exports), before);
    fs::remove_file(f.working.join("z\\ambiguous.txt")).unwrap();

    put_files(&f.working, &[("z/A.txt", b"upper"), ("z/a.txt", b"lower")]);
    let error = f.export(ExportPreset::Full).unwrap_err();
    assert!(error.contains("colliding archive path"), "{error}");
    assert_eq!(output_bytes(&f.exports), before);

    fs::remove_dir_all(f.working.join("z")).unwrap();
    put_files(
        &f.working,
        &[("z/é.txt", b"composed"), ("z/é.txt", b"decomposed")],
    );
    let error = f.export(ExportPreset::Full).unwrap_err();
    assert!(error.contains("colliding archive path"), "{error}");
    assert_eq!(output_bytes(&f.exports), before);
}

#[cfg(unix)]
#[test]
fn links_are_not_followed_and_incomplete_backups_fail() {
    use std::os::unix::fs::symlink;

    let f = Fixture::new();
    let outside = f.temp.path().join("outside-managed-roots");
    put_files(&outside, &[("keep-me.txt", b"outside sentinel")]);
    let exports = f.app_data.join("exports");
    symlink(&outside, &exports).unwrap();
    assert!(f
        .export(ExportPreset::Full)
        .unwrap_err()
        .contains("symlinks"));
    assert!(export_dir(&f.app_data, ID)
        .unwrap_err()
        .contains("symlinks"));
    assert_eq!(
        output_bytes(&outside),
        entries(&[("keep-me.txt", b"outside sentinel")])
    );
    fs::remove_file(exports).unwrap();

    f.seed_outputs();
    let before = output_bytes(&f.exports);
    let output = f.output(ExportPreset::Full);
    fs::remove_file(&output).unwrap();
    symlink(outside.join("keep-me.txt"), &output).unwrap();
    assert!(f
        .export(ExportPreset::Full)
        .unwrap_err()
        .contains("symlinks"));
    assert!(export_file(&f.exports, ID, &ExportPreset::Full.file_name(ID)).is_err());
    assert!(export_file(&f.exports, ID, "../keep-me.txt").is_err());
    assert!(export_file(&f.exports, ID, "keep-me.txt").is_err());
    assert_eq!(
        fs::read(outside.join("keep-me.txt")).unwrap(),
        b"outside sentinel"
    );
    fs::remove_file(&output).unwrap();
    fs::write(&output, &before[&ExportPreset::Full.file_name(ID)]).unwrap();

    symlink(&outside, f.working.join("linked-files")).unwrap();
    assert!(f
        .export(ExportPreset::Backup)
        .unwrap_err()
        .contains("unsupported entry"));
    assert_eq!(output_bytes(&f.exports), before);
    f.assert_export(ExportPreset::Full, entries(WORKING), 0);

    fs::remove_dir_all(f.project.join("sources")).unwrap();
    symlink(&outside, f.project.join("sources")).unwrap();
    assert!(f
        .export(ExportPreset::Diff)
        .unwrap_err()
        .contains("symlinks"));
    fs::remove_dir_all(f.project.join("project")).unwrap();
    symlink(&outside, f.project.join("project")).unwrap();
    assert!(f
        .export(ExportPreset::Full)
        .unwrap_err()
        .contains("symlinks"));
    fs::remove_dir_all(&f.project).unwrap();
    symlink(&outside, &f.project).unwrap();
    assert!(f
        .export(ExportPreset::Backup)
        .unwrap_err()
        .contains("symlinks"));
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub(super) enum Phase {
    Walk,
    Finish,
    SyncTemp,
    Replace,
    #[cfg(unix)]
    SyncParent,
}

type Hook = Box<dyn FnMut(Phase, &Path) -> io::Result<()>>;
type FirstWrite = Box<dyn FnOnce()>;
thread_local! {
    static HOOK: RefCell<Option<Hook>> = const { RefCell::new(None) };
    static FAIL_WRITES: Cell<bool> = const { Cell::new(false) };
    static ON_FIRST_WRITE: RefCell<Option<FirstWrite>> = const { RefCell::new(None) };
}

struct ExportHook;

impl ExportHook {
    fn install(hook: impl FnMut(Phase, &Path) -> io::Result<()> + 'static) -> Self {
        HOOK.with(|current| assert!(current.replace(Some(Box::new(hook))).is_none()));
        Self
    }
}

impl Drop for ExportHook {
    fn drop(&mut self) {
        HOOK.with(|hook| hook.replace(None));
        FAIL_WRITES.set(false);
        ON_FIRST_WRITE.with(|hook| hook.replace(None));
    }
}

pub(super) fn checkpoint(phase: Phase, path: &Path) -> io::Result<()> {
    HOOK.with(|hook| match hook.borrow_mut().as_mut() {
        Some(hook) => hook(phase, path),
        None => Ok(()),
    })
}

pub(super) struct TestWriter<'a>(pub(super) &'a mut File);

impl Write for TestWriter<'_> {
    fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
        if let Some(first_write) = ON_FIRST_WRITE.with(|hook| hook.take()) {
            first_write();
        }
        if FAIL_WRITES.get() {
            return Err(io::Error::other("injected archive write error"));
        }
        self.0.write(bytes)
    }

    fn flush(&mut self) -> io::Result<()> {
        self.0.flush()
    }
}

impl Seek for TestWriter<'_> {
    fn seek(&mut self, position: SeekFrom) -> io::Result<u64> {
        self.0.seek(position)
    }
}

#[test]
fn failures_before_rename_keep_all_previous_outputs() {
    let f = Fixture::new();
    f.seed_outputs();
    let before = output_bytes(&f.exports);

    {
        let _hook = ExportHook::install(|phase, path| {
            if phase == Phase::Walk {
                fs::rename(path, path.with_extension("moved"))?;
            }
            Ok(())
        });
        assert!(f
            .export(ExportPreset::Full)
            .unwrap_err()
            .contains("failed to walk"));
        fs::rename(f.working.with_extension("moved"), &f.working).unwrap();
    }
    assert_eq!(output_bytes(&f.exports), before);

    for (fail_at, expected) in [
        (Phase::Walk, "start ZIP entry"),
        (Phase::Finish, "finish export ZIP"),
    ] {
        let _hook = ExportHook::install(move |phase, _| {
            if phase == fail_at {
                FAIL_WRITES.set(true);
            }
            Ok(())
        });
        let error = f.export(ExportPreset::Full).unwrap_err();
        assert!(
            error.contains(expected) && error.contains("injected archive write error"),
            "{error}"
        );
        assert_eq!(output_bytes(&f.exports), before);
    }

    {
        let _hook = ExportHook::install(|phase, _| {
            if phase == Phase::SyncTemp {
                return Err(io::Error::other("injected temporary file sync failure"));
            }
            Ok(())
        });
        assert!(f
            .export(ExportPreset::Full)
            .unwrap_err()
            .contains("sync temporary export"));
    }
    assert_eq!(output_bytes(&f.exports), before);

    {
        let _hook = ExportHook::install(|phase, path| {
            if phase == Phase::Replace {
                assert_eq!(read_zip(File::open(path)?), entries(WORKING));
                fs::remove_file(path)?;
            }
            Ok(())
        });
        assert!(f
            .export(ExportPreset::Full)
            .unwrap_err()
            .contains("failed to replace export"));
    }
    assert_eq!(output_bytes(&f.exports), before);
    assert_eq!(
        read_zip(File::open(f.output(ExportPreset::Full)).unwrap()),
        entries(OLD_ZIP)
    );
}

#[cfg(unix)]
#[test]
fn open_source_disappearance_aborts_publication() {
    let f = Fixture::new();
    f.seed_outputs();
    let before = output_bytes(&f.exports);
    let first_file = f.working.join("effects/hit.png");
    let _hook = ExportHook::install(move |phase, _| {
        if phase == Phase::Walk {
            let first_file = first_file.clone();
            ON_FIRST_WRITE.with(|hook| {
                hook.replace(Some(Box::new(move || fs::remove_file(first_file).unwrap())));
            });
        }
        Ok(())
    });
    let error = f.export(ExportPreset::Full).unwrap_err();
    assert!(
        error.contains("source changed") && error.contains("hit.png"),
        "{error}"
    );
    assert_eq!(output_bytes(&f.exports), before);
}

#[cfg(unix)]
#[test]
fn parent_sync_failure_reports_the_published_zip_and_open_reader_keeps_old_bytes() {
    let f = Fixture::new();
    f.seed_outputs();
    let before = output_bytes(&f.exports);
    let path = f.output(ExportPreset::Full);
    let old_reader = File::open(&path).unwrap();
    let _hook = ExportHook::install(|phase, _| {
        if phase == Phase::SyncParent {
            return Err(io::Error::other("injected directory sync failure"));
        }
        Ok(())
    });
    let error = f.export(ExportPreset::Full).unwrap_err();
    assert!(
        error.contains(&path.to_string_lossy().to_string()),
        "{error}"
    );
    assert!(
        error.contains("published") && error.contains("durability"),
        "{error}"
    );
    assert_eq!(read_zip(old_reader), entries(OLD_ZIP));
    assert_eq!(read_zip(File::open(path).unwrap()), entries(WORKING));
    f.assert_only_replaced(ExportPreset::Full, &before);
}

#[cfg(windows)]
#[test]
fn replacement_denied_by_windows_file_sharing_keeps_the_old_zip() {
    use std::os::windows::fs::OpenOptionsExt;

    let f = Fixture::new();
    f.seed_outputs();
    let before = output_bytes(&f.exports);
    let reader = fs::OpenOptions::new()
        .read(true)
        .share_mode(1) // FILE_SHARE_READ, without FILE_SHARE_DELETE
        .open(f.output(ExportPreset::Full))
        .unwrap();
    assert!(f
        .export(ExportPreset::Full)
        .unwrap_err()
        .contains("failed to replace export"));
    assert_eq!(read_zip(reader), entries(OLD_ZIP));
    assert_eq!(output_bytes(&f.exports), before);
    f.assert_export(ExportPreset::Full, entries(WORKING), 0);
}

struct ExportProcess(Child);

impl Drop for ExportProcess {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

#[test]
fn terminated_export_releases_process_lock_and_keeps_both_archives_openable() {
    let f = Fixture::new();
    f.seed_outputs();
    let before = output_bytes(&f.exports);
    let lock_file = f.app_data.join(".workbench.lock");
    fs::write(&lock_file, b"stable lock file").unwrap();
    let token = uuid::Uuid::new_v4().simple().to_string();
    fs::write(f.temp.path().join("child-token"), &token).unwrap();
    let (_, module) = module_path!().split_once("::").unwrap();
    let test = format!("{module}::export_child");
    let mut command = Command::new(std::env::current_exe().unwrap());
    command
        .args(["--ignored", "--exact", &test])
        .current_dir(f.temp.path())
        .env_clear()
        .env("WORKBENCH_EXPORT_TEST_TOKEN", token);
    if let Some(library_path) = std::env::var_os("LD_LIBRARY_PATH") {
        command.env("LD_LIBRARY_PATH", library_path);
    }
    let mut child = ExportProcess(command.spawn().unwrap());
    let deadline = Instant::now() + Duration::from_secs(15);
    let marker = f.temp.path().join("ready");
    let temp_name = loop {
        match fs::read_to_string(&marker) {
            Ok(name) => break name,
            Err(error) if error.kind() == io::ErrorKind::NotFound => (),
            Err(error) => panic!("failed to read child marker: {error}"),
        }
        assert!(
            child.0.try_wait().unwrap().is_none(),
            "export child exited early"
        );
        assert!(
            Instant::now() < deadline,
            "export child never reached replacement"
        );
        std::thread::sleep(Duration::from_millis(20));
    };
    assert!(temp_name.starts_with(".workbench-export-") && temp_name.ends_with(".tmp"));
    let abandoned = f.exports.join(&temp_name);
    assert_eq!(read_zip(File::open(&abandoned).unwrap()), entries(WORKING));
    assert_eq!(f.export(ExportPreset::Full).unwrap_err(), WORKBENCH_BUSY);
    assert_eq!(
        export_at(&f.app_data, input("another-project", ExportPreset::Full)).unwrap_err(),
        WORKBENCH_BUSY
    );
    assert_eq!(
        rename_project_at(&f.app_data, ID, "New name").unwrap_err(),
        WORKBENCH_BUSY
    );
    assert_eq!(fs::read(f.project.join("manifest.json")).unwrap(), MANIFEST);
    assert_eq!(
        read_zip(File::open(f.output(ExportPreset::Full)).unwrap()),
        entries(OLD_ZIP)
    );

    child.0.kill().unwrap();
    assert!(!child.0.wait().unwrap().success());
    assert_eq!(
        read_zip(File::open(f.output(ExportPreset::Full)).unwrap()),
        entries(OLD_ZIP)
    );
    let mut before = before;
    before.insert(temp_name, fs::read(&abandoned).unwrap());
    assert_eq!(output_bytes(&f.exports), before);
    assert_eq!(
        rename_project_at(&f.app_data, ID, "New name").unwrap().name,
        "New name"
    );
    f.assert_export(ExportPreset::Full, entries(WORKING), 0);
    f.assert_only_replaced(ExportPreset::Full, &before);
    assert_eq!(fs::read(lock_file).unwrap(), b"stable lock file");
}

#[test]
#[ignore = "started by the subprocess regression test"]
fn export_child() {
    let token = std::env::var("WORKBENCH_EXPORT_TEST_TOKEN").unwrap();
    let root = std::env::current_dir().unwrap();
    assert!(root
        .file_name()
        .unwrap()
        .to_string_lossy()
        .starts_with("workbench-export-test-"));
    assert_eq!(fs::read_to_string(root.join("child-token")).unwrap(), token);
    let marker = root.join("ready");
    let marker_temp = root.join("before-ready");
    let _hook = ExportHook::install(move |phase, path| {
        if phase == Phase::Replace {
            fs::write(&marker_temp, path.file_name().unwrap().as_encoded_bytes())?;
            fs::rename(&marker_temp, &marker)?;
            loop {
                std::thread::park();
            }
        }
        Ok(())
    });
    panic!(
        "child export returned early: {:?}",
        export_at(&root.join("app-data"), input(ID, ExportPreset::Full))
    );
}
