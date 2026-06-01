use castalia_core::{default_prompt_dir, render_prompt, CastaliaError, Prompt, PromptStore, SlotSource};
use std::collections::BTreeMap;
use std::env;
use std::fs;
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
        "rofi" => rofi(&args[1..])?,
        "validate" => validate(prompt_dir_from_args(&args[1..]))?,
        other => {
            // Compact path: `castalia tc.pir` behaves like render.
            render(&[other.to_string()])?;
        }
    }

    Ok(())
}

fn print_help() {
    println!(r#"castalia {VERSION}

Local-first prompt and skill launcher for Linux.

Usage:
  castalia init [--prompt-dir <dir>]
  castalia list [--prompt-dir <dir>]
  castalia render <query> [--set key=value] [--prompt-dir <dir>]
  castalia copy <query> [--set key=value] [--prompt-dir <dir>]
  castalia rofi [--replace] [--prompt-dir <dir>]
  castalia validate [--prompt-dir <dir>]
  castalia path

Environment:
  CASTALIA_PROMPT_DIR overrides the prompt directory.

Source of truth:
  Plain Markdown files with YAML-like frontmatter.
"#);
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
        println!("{}\t{}\t{}\t{}", prompt.id, prompt.title, prompt.aliases.join(","), prompt.tags.join(","));
    }
    Ok(())
}

fn validate(root: PathBuf) -> castalia_core::Result<()> {
    let store = PromptStore::load(&root)?;
    let mut seen = std::collections::BTreeSet::new();
    let mut ok = true;
    for prompt in &store.prompts {
        if !seen.insert(prompt.id.clone()) {
            eprintln!("duplicate id: {}", prompt.id);
            ok = false;
        }
    }
    if ok {
        println!("ok: {} prompt(s) in {}", store.prompts.len(), store.root.display());
        Ok(())
    } else {
        Err(CastaliaError::Parse { path: root, message: "validation failed".into() })
    }
}

fn render(args: &[String]) -> castalia_core::Result<()> {
    let root = prompt_dir_from_args(args);
    let args = strip_prompt_dir_args(args);
    let query = args.first().ok_or_else(|| CastaliaError::NotFound { query: "missing query".into() })?;
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
    let query = args.first().ok_or_else(|| CastaliaError::NotFound { query: "missing query".into() })?;
    let store = load_store(root)?;
    let prompt = store.find(query)?;
    let values = values_from_args(&args[1..]);
    let rendered = render_prompt(prompt, &values)?;
    copy_to_clipboard(&rendered)?;
    notify("Castalia", &format!("Copied {}", prompt.id));
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

fn rofi(args: &[String]) -> castalia_core::Result<()> {
    let root = prompt_dir_from_args(args);
    let args = strip_prompt_dir_args(args);
    let replace = args.iter().any(|arg| arg == "--replace" || arg == "-replace");
    let no_copy = args.iter().any(|arg| arg == "--no-copy");
    let store = load_store(root)?;
    let rows = store.prompts.iter().map(Prompt::rofi_label).collect::<Vec<_>>().join("\n");
    let selected = run_rofi_dmenu(&rows, "castalia", replace)?;
    if selected.trim().is_empty() {
        return Ok(());
    }
    let id = selected.split_whitespace().next().unwrap_or_default();
    let prompt = store.find(id)?;
    let values = collect_slot_values_with_rofi(prompt, replace)?;
    let rendered = render_prompt(prompt, &values)?;
    if no_copy {
        print!("{rendered}");
    } else {
        copy_to_clipboard(&rendered)?;
        notify("Castalia", &format!("Copied {}", prompt.id));
    }
    Ok(())
}

fn collect_slot_values_with_rofi(prompt: &Prompt, replace: bool) -> castalia_core::Result<BTreeMap<String, String>> {
    let mut values = BTreeMap::new();
    for slot in &prompt.slots {
        match slot.source {
            SlotSource::Clipboard => {
                let value = read_clipboard().unwrap_or_default();
                if !value.trim().is_empty() {
                    values.insert(slot.name.clone(), value);
                    continue;
                }
            }
            SlotSource::Manual => {}
        }
        let label = if slot.multiline {
            format!("{} (paste allowed)", slot.label)
        } else {
            slot.label.clone()
        };
        let value = run_rofi_dmenu("", &label, replace)?;
        if value.trim().is_empty() {
            if let Some(default) = &slot.default {
                values.insert(slot.name.clone(), default.clone());
            } else if slot.required {
                return Err(CastaliaError::MissingSlot { name: slot.name.clone(), label: slot.label.clone() });
            }
        } else {
            values.insert(slot.name.clone(), value);
        }
    }
    Ok(values)
}

fn run_rofi_dmenu(input: &str, prompt: &str, replace: bool) -> castalia_core::Result<String> {
    let rofi = find_executable(&["rofi"])
        .ok_or_else(|| CastaliaError::NotFound { query: "rofi executable".into() })?;
    let mut command = Command::new(rofi);
    command.args(["-dmenu", "-i", "-p", prompt]);
    if replace {
        command.arg("-replace");
    }
    command.stdin(Stdio::piped()).stdout(Stdio::piped());
    let mut child = command.spawn()?;
    if let Some(mut stdin) = child.stdin.take() {
        stdin.write_all(input.as_bytes())?;
    }
    let output = child.wait_with_output()?;
    if !output.status.success() {
        return Ok(String::new());
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim_end_matches('\n').to_string())
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
    Err(CastaliaError::NotFound { query: "wl-copy/xclip/xsel executable".into() })
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
        Err(CastaliaError::Io(io::Error::new(io::ErrorKind::Other, "clipboard command failed")))
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
    path.is_file() && path.metadata().map(|meta| meta.permissions().mode() & 0o111 != 0).unwrap_or(false)
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
