mod launcher;

use castalia_core::{
    body_preview, default_prompt_dir, is_safe_prompt_id, parse_prompt, prompt_file_name_for_id,
    render_prompt, validate_prompt_dir, CastaliaError, PromptStore, ValidationReport,
};
use launcher::{LaunchOptions, SlotInputMode};
use std::collections::BTreeMap;
use std::env;
use std::fs::{self, OpenOptions};
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

const VERSION: &str = env!("CARGO_PKG_VERSION");

fn main() {
    if let Err(err) = run() {
        eprintln!("castalia: {err}");
        std::process::exit(1);
    }
}

fn run() -> castalia_core::Result<()> {
    let args: Vec<String> = env::args().skip(1).collect();
    let Some(command) = args.first().map(String::as_str) else {
        print_help();
        return Ok(());
    };

    match command {
        "help" | "--help" | "-h" => print_help(),
        "version" | "--version" | "-V" => println!("castalia {VERSION}"),
        "path" => println!("{}", prompt_dir_from_args(&args[1..]).display()),
        "init" => init(prompt_dir_from_args(&args[1..]))?,
        "list" => list(prompt_dir_from_args(&args[1..]))?,
        "render" => render(&args[1..])?,
        "copy" => copy(&args[1..])?,
        "launch" => launch_cmd(&args[1..], false)?,
        "launch-tui" => launch_cmd(&args[1..], true)?,
        "rofi" => {
            return Err(CastaliaError::InvalidInput {
                message: "`castalia rofi` was removed in v0.2.5; use `castalia launch`".into(),
            });
        }
        "validate" => validate(prompt_dir_from_args(&args[1..]))?,
        "inspect" => inspect(&args[1..])?,
        "new" => new_prompt(&args[1..])?,
        "edit" => edit(&args[1..])?,
        other => {
            // Compact path: `castalia tc.pir` behaves like render.
            render(&[other.to_string()])?;
        }
    }

    Ok(())
}

fn print_help() {
    println!(
        r#"castalia {VERSION}

Local-first prompt and skill launcher for Linux.

Usage:
  castalia init [--prompt-dir <dir>]
  castalia list [--prompt-dir <dir>]
  castalia render <query> [--set key=value] [--prompt-dir <dir>]
  castalia copy <query> [--set key=value] [--prompt-dir <dir>]
  castalia launch [--query <query>] [--set key=value] [--slot-input ui|editor|clipboard-first] [--no-copy] [--prompt-dir <dir>]
  castalia launch-tui [--query <query>] [--set key=value] [--slot-input ui|editor|clipboard-first] [--no-copy] [--prompt-dir <dir>]
  castalia validate [--prompt-dir <dir>]
  castalia inspect <query> [--prompt-dir <dir>]
  castalia new <id> [--title <title>] [--alias <alias>] [--tag <tag>] [--mode text|command|form] [--prompt-dir <dir>]
  castalia edit <query> [--prompt-dir <dir>]
  castalia path

Environment:
  CASTALIA_PROMPT_DIR overrides the prompt directory.

Source of truth:
  Plain Markdown files with YAML-like frontmatter.
"#
    );
}

fn prompt_dir_from_args(args: &[String]) -> PathBuf {
    let mut dir = default_prompt_dir();
    let mut i = 0;
    while i < args.len() {
        if args[i] == "--prompt-dir" {
            if let Some(value) = args.get(i + 1) {
                dir = PathBuf::from(value);
                i += 2;
                continue;
            }
        }
        i += 1;
    }
    dir
}

fn strip_prompt_dir_args(args: &[String]) -> Vec<String> {
    let mut stripped = Vec::new();
    let mut i = 0;
    while i < args.len() {
        if args[i] == "--prompt-dir" {
            i += 2;
            continue;
        }
        stripped.push(args[i].clone());
        i += 1;
    }
    stripped
}

fn init(root: PathBuf) -> castalia_core::Result<()> {
    fs::create_dir_all(&root)?;
    let samples = sample_prompts();
    for (name, body) in samples {
        let path = root.join(name);
        if !path.exists() {
            fs::write(path, body)?;
        }
    }
    println!("initialized prompt store: {}", root.display());
    Ok(())
}

fn sample_prompts() -> Vec<(&'static str, &'static str)> {
    vec![
        ("tc.db.md", include_str!("../../../prompts/tc.db.md")),
        ("tc.pir.md", include_str!("../../../prompts/tc.pir.md")),
        ("tc.ps.md", include_str!("../../../prompts/tc.ps.md")),
        ("tc.sc.md", include_str!("../../../prompts/tc.sc.md")),
        ("tc.dl.md", include_str!("../../../prompts/tc.dl.md")),
        ("tc.card.md", include_str!("../../../prompts/tc.card.md")),
        ("tc.pub.md", include_str!("../../../prompts/tc.pub.md")),
        ("tc.wr.md", include_str!("../../../prompts/tc.wr.md")),
    ]
}

fn load_store(root: PathBuf) -> castalia_core::Result<PromptStore> {
    let store = PromptStore::load(&root)?;
    if store.prompts.is_empty() {
        return Err(CastaliaError::NotFound {
            query: format!("no prompts in {}. Run `castalia init`.", root.display()),
        });
    }
    Ok(store)
}

fn list(root: PathBuf) -> castalia_core::Result<()> {
    let store = load_store(root)?;
    for prompt in store.prompts {
        println!(
            "{}\t{}\t{}\t{}",
            prompt.id,
            prompt.title,
            prompt.aliases.join(","),
            prompt.tags.join(",")
        );
    }
    Ok(())
}

fn validate(root: PathBuf) -> castalia_core::Result<()> {
    let report = validate_prompt_dir(&root);
    if report.is_ok() {
        let store = PromptStore::load(&root)?;
        println!(
            "ok: {} prompt(s) in {}",
            store.prompts.len(),
            store.root.display()
        );
        return Ok(());
    }

    print_validation_report(&report);
    Err(CastaliaError::Validation {
        root,
        issues: report.issues,
    })
}

fn inspect(args: &[String]) -> castalia_core::Result<()> {
    let root = prompt_dir_from_args(args);
    let args = strip_prompt_dir_args(args);
    let query = args.first().ok_or_else(|| CastaliaError::NotFound {
        query: "missing query".into(),
    })?;
    let store = load_store(root.clone())?;
    let prompt = store.find(query)?;

    println!("id: {}", prompt.id);
    println!("title: {}", prompt.title);
    println!("path: {}", prompt.path.display());
    println!("mode: {:?}", prompt.mode);
    println!("aliases: {}", prompt.aliases.join(","));
    println!("tags: {}", prompt.tags.join(","));
    if let Some(description) = &prompt.description {
        println!("description: {description}");
    }
    if prompt.slots.is_empty() {
        println!("slots: none");
    } else {
        println!("slots:");
        for slot in &prompt.slots {
            println!(
                "  - {} ({}, required: {}, multiline: {}, source: {:?})",
                slot.name, slot.label, slot.required, slot.multiline, slot.source
            );
        }
    }
    println!("preview: {}", body_preview(&prompt.body, 240));

    let dir_report = validate_prompt_dir(root);
    let mut report = ValidationReport::default();
    for issue in dir_report
        .issues
        .into_iter()
        .filter(|issue| issue.path == prompt.path)
    {
        report.issues.push(issue);
    }
    if report.is_ok() {
        println!("validation: ok");
    } else {
        println!("validation: {} issue(s)", report.issues.len());
        print_validation_report(&report);
    }

    Ok(())
}

fn new_prompt(args: &[String]) -> castalia_core::Result<()> {
    let root = prompt_dir_from_args(args);
    let args = strip_prompt_dir_args(args);
    let id = args.first().ok_or_else(|| CastaliaError::NotFound {
        query: "missing id".into(),
    })?;
    if !is_safe_prompt_id(id) {
        return Err(CastaliaError::InvalidInput {
            message: format!(
                "id '{id}' must use only ASCII letters, numbers, '.', '_', or '-' and cannot start/end with '.' or contain '..'"
            ),
        });
    }

    let title = value_after_flag(&args[1..], "--title")
        .cloned()
        .unwrap_or_else(|| id.to_string());
    let mode = value_after_flag(&args[1..], "--mode")
        .cloned()
        .unwrap_or_else(|| "text".to_string());
    let aliases = values_after_flag(&args[1..], "--alias");
    let tags = values_after_flag(&args[1..], "--tag");
    validate_new_prompt_options(id, &aliases, &tags)?;

    let store = PromptStore::load(&root)?;
    if store
        .prompts
        .iter()
        .any(|prompt| prompt.id == *id || prompt.aliases.iter().any(|alias| alias == id))
    {
        return Err(CastaliaError::InvalidInput {
            message: format!("id '{id}' conflicts with an existing id or alias"),
        });
    }

    fs::create_dir_all(&root)?;
    let path = root.join(prompt_file_name_for_id(id));
    let body = render_new_prompt(id, &title, &mode, &aliases, &tags);
    parse_prompt(&body, &path)?;
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&path)?;
    file.write_all(body.as_bytes())?;
    println!("created {}", path.display());
    Ok(())
}

fn edit(args: &[String]) -> castalia_core::Result<()> {
    let root = prompt_dir_from_args(args);
    let args = strip_prompt_dir_args(args);
    let query = args.first().ok_or_else(|| CastaliaError::NotFound {
        query: "missing query".into(),
    })?;
    let store = load_store(root.clone())?;
    let path = store.find(query)?.path.clone();
    let editor = env::var("VISUAL")
        .or_else(|_| env::var("EDITOR"))
        .map_err(|_| CastaliaError::NotFound {
            query: "$VISUAL or $EDITOR".into(),
        })?;
    let status = Command::new(editor).arg(&path).status()?;
    if !status.success() {
        return Err(CastaliaError::Io(io::Error::other("editor command failed")));
    }

    let report = validate_prompt_dir(&root);
    if report.is_ok() {
        println!("ok: edited {}", path.display());
        return Ok(());
    }

    print_validation_report(&report);
    Err(CastaliaError::Validation {
        root,
        issues: report.issues,
    })
}

fn render(args: &[String]) -> castalia_core::Result<()> {
    let root = prompt_dir_from_args(args);
    let args = strip_prompt_dir_args(args);
    let query = args.first().ok_or_else(|| CastaliaError::NotFound {
        query: "missing query".into(),
    })?;
    let store = load_store(root)?;
    let prompt = store.find(query)?;
    let values = values_from_args(&args[1..]);
    let rendered = render_prompt(prompt, &values)?;
    print!("{rendered}");
    Ok(())
}

fn copy(args: &[String]) -> castalia_core::Result<()> {
    let root = prompt_dir_from_args(args);
    let args = strip_prompt_dir_args(args);
    let query = args.first().ok_or_else(|| CastaliaError::NotFound {
        query: "missing query".into(),
    })?;
    let store = load_store(root)?;
    let prompt = store.find(query)?;
    let values = values_from_args(&args[1..]);
    let rendered = render_prompt(prompt, &values)?;
    copy_to_clipboard(&rendered)?;
    notify("Castalia", &format!("Copied {}", prompt.id));
    Ok(())
}

fn launch_cmd(args: &[String], use_tui: bool) -> castalia_core::Result<()> {
    let root = prompt_dir_from_args(args);
    let args = strip_prompt_dir_args(args);
    let no_copy = args.iter().any(|arg| arg == "--no-copy");
    let query = value_after_flag(&args, "--query").cloned();
    let slot_input_mode = value_after_flag(&args, "--slot-input")
        .map(|value| SlotInputMode::parse(value))
        .unwrap_or_else(SlotInputMode::from_env)?;
    let clipboard = read_clipboard().ok();
    let options = LaunchOptions {
        root,
        query,
        initial_values: values_from_args(&args),
        slot_input_mode,
        clipboard,
    };
    let result = if use_tui {
        launcher::launch_tui(options)
    } else {
        launcher::launch(options)
    }?;

    let Some(result) = result else {
        return Ok(());
    };

    if no_copy {
        print!("{}", result.rendered);
    } else {
        copy_to_clipboard(&result.rendered)?;
        notify("Castalia", &format!("Copied {}", result.prompt_id));
    }
    Ok(())
}

fn values_from_args(args: &[String]) -> BTreeMap<String, String> {
    let mut values = BTreeMap::new();
    let mut i = 0;
    while i < args.len() {
        if args[i] == "--set" {
            if let Some(pair) = args.get(i + 1) {
                if let Some((key, value)) = pair.split_once('=') {
                    values.insert(key.to_string(), value.to_string());
                }
                i += 2;
                continue;
            }
        }
        i += 1;
    }
    values
}

fn value_after_flag<'a>(args: &'a [String], flag: &str) -> Option<&'a String> {
    let mut i = 0;
    while i < args.len() {
        if args[i] == flag {
            return args.get(i + 1);
        }
        i += 1;
    }
    None
}

fn values_after_flag(args: &[String], flag: &str) -> Vec<String> {
    let mut values = Vec::new();
    let mut i = 0;
    while i < args.len() {
        if args[i] == flag {
            if let Some(value) = args.get(i + 1) {
                values.push(value.clone());
            }
            i += 2;
            continue;
        }
        i += 1;
    }
    values
}

fn validate_new_prompt_options(
    id: &str,
    aliases: &[String],
    tags: &[String],
) -> castalia_core::Result<()> {
    let mut seen_aliases = std::collections::BTreeSet::new();
    for alias in aliases {
        if alias.trim().is_empty() {
            return Err(CastaliaError::InvalidInput {
                message: "alias must not be empty".into(),
            });
        }
        if alias == id {
            return Err(CastaliaError::InvalidInput {
                message: format!("alias '{alias}' conflicts with id '{id}'"),
            });
        }
        if !seen_aliases.insert(alias) {
            return Err(CastaliaError::InvalidInput {
                message: format!("duplicate alias '{alias}'"),
            });
        }
    }
    for tag in tags {
        if tag.trim().is_empty() {
            return Err(CastaliaError::InvalidInput {
                message: "tag must not be empty".into(),
            });
        }
    }
    Ok(())
}

fn render_new_prompt(
    id: &str,
    title: &str,
    mode: &str,
    aliases: &[String],
    tags: &[String],
) -> String {
    let mut frontmatter = vec![
        "---".to_string(),
        format!("id: {id}"),
        format!("title: {}", quote_scalar(title)),
    ];
    if !aliases.is_empty() {
        frontmatter.push(format!("aliases: {}", aliases.join(",")));
    }
    if !tags.is_empty() {
        frontmatter.push(format!("tags: {}", tags.join(",")));
    }
    frontmatter.push(format!("mode: {mode}"));
    frontmatter.push("---".to_string());
    frontmatter.push(String::new());
    frontmatter.push("Write your prompt here.".to_string());
    frontmatter.push(String::new());
    frontmatter.join("\n")
}

fn quote_scalar(value: &str) -> String {
    if value
        .chars()
        .all(|ch| ch.is_ascii_alphanumeric() || ch == ' ' || matches!(ch, '-' | '_' | '.'))
    {
        return value.to_string();
    }
    format!("\"{}\"", value.replace('"', "\\\""))
}

fn print_validation_report(report: &ValidationReport) {
    for issue in &report.issues {
        eprintln!("{}: {}", issue.path.display(), issue.message);
    }
}

fn copy_to_clipboard(text: &str) -> castalia_core::Result<()> {
    if let Some(cmd) = find_executable(&["wl-copy"]) {
        return run_stdin(cmd, &[], text);
    }
    if let Some(cmd) = find_executable(&["xclip"]) {
        return run_stdin(cmd, &["-selection", "clipboard"], text);
    }
    if let Some(cmd) = find_executable(&["xsel"]) {
        return run_stdin(cmd, &["--clipboard", "--input"], text);
    }
    Err(CastaliaError::NotFound {
        query: "wl-copy/xclip/xsel executable".into(),
    })
}

fn read_clipboard() -> castalia_core::Result<String> {
    if let Some(cmd) = find_executable(&["wl-paste"]) {
        return read_command(cmd, &["--no-newline"]);
    }
    if let Some(cmd) = find_executable(&["xclip"]) {
        return read_command(cmd, &["-selection", "clipboard", "-out"]);
    }
    if let Some(cmd) = find_executable(&["xsel"]) {
        return read_command(cmd, &["--clipboard", "--output"]);
    }
    Ok(String::new())
}

fn run_stdin(cmd: PathBuf, args: &[&str], text: &str) -> castalia_core::Result<()> {
    let mut child = Command::new(cmd).args(args).stdin(Stdio::piped()).spawn()?;
    if let Some(mut stdin) = child.stdin.take() {
        stdin.write_all(text.as_bytes())?;
    }
    let status = child.wait()?;
    if status.success() {
        Ok(())
    } else {
        Err(CastaliaError::Io(io::Error::other(
            "clipboard command failed",
        )))
    }
}

fn read_command(cmd: PathBuf, args: &[&str]) -> castalia_core::Result<String> {
    let output = Command::new(cmd).args(args).output()?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Ok(String::new())
    }
}

fn find_executable(names: &[&str]) -> Option<PathBuf> {
    let path = env::var_os("PATH")?;
    for dir in env::split_paths(&path) {
        for name in names {
            let candidate = dir.join(name);
            if is_executable_file(&candidate) {
                return Some(candidate);
            }
        }
    }
    None
}

#[cfg(unix)]
fn is_executable_file(path: &Path) -> bool {
    use std::os::unix::fs::PermissionsExt;
    path.is_file()
        && path
            .metadata()
            .map(|meta| meta.permissions().mode() & 0o111 != 0)
            .unwrap_or(false)
}

#[cfg(not(unix))]
fn is_executable_file(path: &Path) -> bool {
    path.is_file()
}

fn notify(summary: &str, body: &str) {
    if let Some(cmd) = find_executable(&["notify-send"]) {
        let _ = Command::new(cmd).arg(summary).arg(body).status();
    }
}
