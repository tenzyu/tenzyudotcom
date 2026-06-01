use castalia_core::{body_preview, render_prompt, CastaliaError, Prompt, PromptStore, SlotSource};
use std::collections::BTreeMap;
use std::env;
use std::fs::{self, File};
use std::io::{self, IsTerminal, Read, Write};
use std::path::PathBuf;
use std::process::{Command, ExitStatus, Output, Stdio};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SlotInputMode {
    Ui,
    Editor,
    ClipboardFirst,
}

impl SlotInputMode {
    pub fn parse(value: &str) -> castalia_core::Result<Self> {
        match value.trim().to_ascii_lowercase().as_str() {
            "ui" => Ok(Self::Ui),
            "editor" => Ok(Self::Editor),
            "clipboard-first" => Ok(Self::ClipboardFirst),
            other => Err(CastaliaError::InvalidInput {
                message: format!(
                    "unknown slot input mode '{other}', expected ui, editor, or clipboard-first"
                ),
            }),
        }
    }

    pub fn from_env() -> castalia_core::Result<Self> {
        match env::var("CASTALIA_SLOT_INPUT_MODE") {
            Ok(value) => Self::parse(&value),
            Err(_) => Ok(Self::Ui),
        }
    }
}

pub struct LaunchOptions {
    pub root: PathBuf,
    pub query: Option<String>,
    pub initial_values: BTreeMap<String, String>,
    pub slot_input_mode: SlotInputMode,
    pub clipboard: Option<String>,
}

pub struct LaunchResult {
    pub prompt_id: String,
    pub rendered: String,
}

pub fn launch(options: LaunchOptions) -> castalia_core::Result<Option<LaunchResult>> {
    let store = PromptStore::load(&options.root)?;
    if store.prompts.is_empty() {
        return Err(CastaliaError::NotFound {
            query: format!(
                "no prompts in {}. Run `castalia init`.",
                options.root.display()
            ),
        });
    }

    let prompt = if let Some(query) = &options.query {
        store.find(query)?
    } else {
        let Some(index) = select_prompt(&store)? else {
            return Ok(None);
        };
        &store.prompts[index]
    };

    let values = collect_slot_values(prompt, &options)?;
    let rendered = render_prompt(prompt, &values)?;
    Ok(Some(LaunchResult {
        prompt_id: prompt.id.clone(),
        rendered,
    }))
}

fn select_prompt(store: &PromptStore) -> castalia_core::Result<Option<usize>> {
    let _terminal = TerminalGuard::enter()?;
    let mut query = String::new();
    let mut selected = 0usize;

    loop {
        let matches = prompt_matches(store, &query);
        if selected >= matches.len() {
            selected = matches.len().saturating_sub(1);
        }
        draw_prompt_selector(store, &query, &matches, selected)?;
        match read_key()? {
            Key::Escape => return Ok(None),
            Key::Enter => return Ok(matches.get(selected).copied()),
            Key::Backspace => {
                query.pop();
                selected = 0;
            }
            Key::Up => selected = selected.saturating_sub(1),
            Key::Down => {
                if selected + 1 < matches.len() {
                    selected += 1;
                }
            }
            Key::Char(ch) => {
                query.push(ch);
                selected = 0;
            }
            Key::CtrlD => {}
        }
    }
}

fn prompt_matches(store: &PromptStore, query: &str) -> Vec<usize> {
    let query = query.trim().to_ascii_lowercase();
    store
        .prompts
        .iter()
        .enumerate()
        .filter_map(|(index, prompt)| {
            if query.is_empty() || prompt.search_text().to_ascii_lowercase().contains(&query) {
                Some(index)
            } else {
                None
            }
        })
        .collect()
}

fn draw_prompt_selector(
    store: &PromptStore,
    query: &str,
    matches: &[usize],
    selected: usize,
) -> castalia_core::Result<()> {
    let mut out = io::stdout();
    write!(out, "\x1b[2J\x1b[H")?;
    writeln!(out, "Castalia launch")?;
    writeln!(out, "Search: {query}")?;
    writeln!(
        out,
        "Enter: select  Esc: cancel  ↑/↓ or Ctrl-P/Ctrl-N: move"
    )?;
    writeln!(out)?;
    if matches.is_empty() {
        writeln!(out, "No prompts matched.")?;
    }
    for (row, index) in matches.iter().take(10).enumerate() {
        let prompt = &store.prompts[*index];
        if row == selected {
            write!(out, "\x1b[7m")?;
        }
        writeln!(
            out,
            "{:<16} {} — {}",
            prompt.id,
            prompt.title,
            body_preview(&prompt.body, 96)
        )?;
        if row == selected {
            write!(out, "\x1b[0m")?;
        }
    }
    out.flush()?;
    Ok(())
}

fn collect_slot_values(
    prompt: &Prompt,
    options: &LaunchOptions,
) -> castalia_core::Result<BTreeMap<String, String>> {
    let mut values = options.initial_values.clone();
    for slot in &prompt.slots {
        if values.contains_key(&slot.name) {
            continue;
        }
        if matches!(slot.source, SlotSource::Clipboard)
            || matches!(options.slot_input_mode, SlotInputMode::ClipboardFirst)
        {
            if let Some(value) = options
                .clipboard
                .as_ref()
                .filter(|value| !value.trim().is_empty())
            {
                values.insert(slot.name.clone(), value.clone());
                continue;
            }
        }
    }

    match options.slot_input_mode {
        SlotInputMode::Editor => collect_missing_slots_with_editor(prompt, &mut values)?,
        SlotInputMode::Ui | SlotInputMode::ClipboardFirst => {
            collect_missing_slots_with_ui(prompt, &mut values)?
        }
    }

    Ok(values)
}

fn collect_missing_slots_with_ui(
    prompt: &Prompt,
    values: &mut BTreeMap<String, String>,
) -> castalia_core::Result<()> {
    for slot in &prompt.slots {
        if values.contains_key(&slot.name) {
            continue;
        }
        let value = if slot.multiline {
            read_multiline_slot(&slot.name, &slot.label)?
        } else {
            read_single_line_slot(&slot.name, &slot.label)?
        };
        if value.trim().is_empty() {
            if let Some(default) = &slot.default {
                values.insert(slot.name.clone(), default.clone());
            } else if slot.required {
                return Err(CastaliaError::MissingSlot {
                    name: slot.name.clone(),
                    label: slot.label.clone(),
                });
            }
        } else {
            values.insert(slot.name.clone(), value);
        }
    }
    Ok(())
}

fn read_single_line_slot(name: &str, label: &str) -> castalia_core::Result<String> {
    let _terminal = TerminalGuard::enter()?;
    let mut value = String::new();
    loop {
        draw_slot_editor(label, name, &value, false)?;
        match read_key()? {
            Key::Escape => {
                return Err(CastaliaError::InvalidInput {
                    message: "launcher canceled".into(),
                });
            }
            Key::Enter | Key::CtrlD => return Ok(value),
            Key::Backspace => {
                value.pop();
            }
            Key::Char(ch) => value.push(ch),
            Key::Up | Key::Down => {}
        }
    }
}

fn read_multiline_slot(name: &str, label: &str) -> castalia_core::Result<String> {
    let _terminal = TerminalGuard::enter()?;
    let mut value = String::new();
    loop {
        draw_slot_editor(label, name, &value, true)?;
        match read_key()? {
            Key::Escape => {
                return Err(CastaliaError::InvalidInput {
                    message: "launcher canceled".into(),
                });
            }
            Key::CtrlD => return Ok(value),
            Key::Enter => value.push('\n'),
            Key::Backspace => {
                value.pop();
            }
            Key::Char(ch) => value.push(ch),
            Key::Up | Key::Down => {}
        }
    }
}

fn draw_slot_editor(
    label: &str,
    name: &str,
    value: &str,
    multiline: bool,
) -> castalia_core::Result<()> {
    let mut out = io::stdout();
    write!(out, "\x1b[2J\x1b[H")?;
    writeln!(out, "Castalia slot")?;
    writeln!(out, "{label} ({name})")?;
    if multiline {
        writeln!(out, "Ctrl-D: submit  Esc: cancel  Enter: newline")?;
    } else {
        writeln!(out, "Enter: submit  Esc: cancel")?;
    }
    writeln!(out, "{}", "-".repeat(72))?;
    write!(out, "{value}")?;
    out.flush()?;
    Ok(())
}

fn collect_missing_slots_with_editor(
    prompt: &Prompt,
    values: &mut BTreeMap<String, String>,
) -> castalia_core::Result<()> {
    let missing = prompt
        .slots
        .iter()
        .filter(|slot| !values.contains_key(&slot.name))
        .collect::<Vec<_>>();
    if missing.is_empty() {
        return Ok(());
    }

    let path = temp_slot_path(&prompt.id);
    fs::write(&path, render_slot_document(&missing))?;
    let editor = env::var("VISUAL")
        .or_else(|_| env::var("EDITOR"))
        .map_err(|_| CastaliaError::NotFound {
            query: "$VISUAL or $EDITOR".into(),
        })?;
    let status = Command::new(editor).arg(&path).status()?;
    if !status.success() {
        let _ = fs::remove_file(&path);
        return Err(CastaliaError::Io(io::Error::other("editor command failed")));
    }
    let raw = fs::read_to_string(&path)?;
    let _ = fs::remove_file(&path);
    for (name, value) in parse_slot_document(&raw) {
        values.insert(name, value);
    }
    Ok(())
}

fn temp_slot_path(prompt_id: &str) -> PathBuf {
    let safe_id = prompt_id.replace(['/', '\\', ':'], "_");
    env::temp_dir().join(format!(
        "castalia-slots-{}-{safe_id}.md",
        std::process::id()
    ))
}

fn render_slot_document(slots: &[&castalia_core::Slot]) -> String {
    let mut out = String::from(
        "# Fill Castalia slot values, save, and exit.\n# Text outside slot markers is ignored.\n\n",
    );
    for slot in slots {
        out.push_str(&format!("<<<slot:{}>>>\n", slot.name));
        if let Some(default) = &slot.default {
            out.push_str(default);
            if !default.ends_with('\n') {
                out.push('\n');
            }
        }
        out.push_str("<<<end>>>\n\n");
    }
    out
}

fn parse_slot_document(raw: &str) -> BTreeMap<String, String> {
    let mut values = BTreeMap::new();
    let mut current_name: Option<String> = None;
    let mut current_value = String::new();
    for line in raw.lines() {
        if let Some(name) = line
            .strip_prefix("<<<slot:")
            .and_then(|rest| rest.strip_suffix(">>>"))
        {
            if let Some(previous) = current_name.replace(name.to_string()) {
                values.insert(previous, current_value.trim_end_matches('\n').to_string());
                current_value.clear();
            }
            continue;
        }
        if line == "<<<end>>>" {
            if let Some(previous) = current_name.take() {
                values.insert(previous, current_value.trim_end_matches('\n').to_string());
                current_value.clear();
            }
            continue;
        }
        if current_name.is_some() {
            current_value.push_str(line);
            current_value.push('\n');
        }
    }
    if let Some(previous) = current_name {
        values.insert(previous, current_value.trim_end_matches('\n').to_string());
    }
    values
}

struct TerminalGuard {
    original: String,
}

impl TerminalGuard {
    fn enter() -> castalia_core::Result<Self> {
        if !io::stdin().is_terminal() || !io::stdout().is_terminal() {
            return Err(CastaliaError::InvalidInput {
                message: "interactive launcher requires a terminal".into(),
            });
        }
        let output = run_stty_output(&["-g"])?;
        if !output.status.success() {
            return Err(CastaliaError::Io(io::Error::other(
                "failed to read terminal mode",
            )));
        }
        let original = String::from_utf8_lossy(&output.stdout).trim().to_string();
        let status = run_stty_status(&["-echo", "-icanon", "min", "0", "time", "1"])?;
        if !status.success() {
            return Err(CastaliaError::Io(io::Error::other(
                "failed to enter raw terminal mode",
            )));
        }
        write!(io::stdout(), "\x1b[?1049h\x1b[?25l")?;
        io::stdout().flush()?;
        Ok(Self { original })
    }
}

impl Drop for TerminalGuard {
    fn drop(&mut self) {
        let _ = write!(io::stdout(), "\x1b[?25h\x1b[?1049l");
        let _ = io::stdout().flush();
        let _ = run_stty_status(&[&self.original]);
    }
}

fn run_stty_output(args: &[&str]) -> io::Result<Output> {
    let tty = File::open("/dev/tty")?;
    Command::new("stty")
        .args(args)
        .stdin(Stdio::from(tty))
        .output()
}

fn run_stty_status(args: &[&str]) -> io::Result<ExitStatus> {
    let tty = File::open("/dev/tty")?;
    Command::new("stty")
        .args(args)
        .stdin(Stdio::from(tty))
        .status()
}

enum Key {
    Char(char),
    Enter,
    Backspace,
    Escape,
    Up,
    Down,
    CtrlD,
}

fn read_key() -> castalia_core::Result<Key> {
    let mut input = io::stdin();
    let mut first = [0u8; 1];
    while input.read(&mut first)? == 0 {
        continue;
    }
    match first[0] {
        b'\r' | b'\n' => Ok(Key::Enter),
        0x04 => Ok(Key::CtrlD),
        0x7f | 0x08 => Ok(Key::Backspace),
        0x0e => Ok(Key::Down),
        0x10 => Ok(Key::Up),
        0x1b => read_escape_or_key(input),
        byte => read_utf8_char(input, byte).map(Key::Char),
    }
}

fn read_escape_or_key(mut input: io::Stdin) -> castalia_core::Result<Key> {
    let Some(first) = read_optional_byte(&mut input)? else {
        return Ok(Key::Escape);
    };
    if first != b'[' {
        return Ok(Key::Escape);
    }
    let Some(second) = read_optional_byte(&mut input)? else {
        return Ok(Key::Escape);
    };
    match second {
        b'A' => Ok(Key::Up),
        b'B' => Ok(Key::Down),
        _ => Ok(Key::Escape),
    }
}

fn read_optional_byte(input: &mut io::Stdin) -> castalia_core::Result<Option<u8>> {
    let mut byte = [0u8; 1];
    match input.read(&mut byte) {
        Ok(0) => Ok(None),
        Ok(_) => Ok(Some(byte[0])),
        Err(err) if err.kind() == io::ErrorKind::WouldBlock => Ok(None),
        Err(err) => Err(CastaliaError::Io(err)),
    }
}

fn read_utf8_char(mut input: io::Stdin, first: u8) -> castalia_core::Result<char> {
    let width = utf8_width(first);
    let mut bytes = vec![first];
    for _ in 1..width {
        let mut byte = [0u8; 1];
        input.read_exact(&mut byte)?;
        bytes.push(byte[0]);
    }
    let text = std::str::from_utf8(&bytes).map_err(|err| CastaliaError::InvalidInput {
        message: format!("invalid UTF-8 input: {err}"),
    })?;
    text.chars()
        .next()
        .ok_or_else(|| CastaliaError::InvalidInput {
            message: "empty UTF-8 input".into(),
        })
}

fn utf8_width(byte: u8) -> usize {
    if byte & 0b1000_0000 == 0 {
        1
    } else if byte & 0b1110_0000 == 0b1100_0000 {
        2
    } else if byte & 0b1111_0000 == 0b1110_0000 {
        3
    } else if byte & 0b1111_1000 == 0b1111_0000 {
        4
    } else {
        1
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_slot_document_sections() {
        let raw = r#"
ignored
<<<slot:first>>>
hello
world
<<<end>>>
<<<slot:second>>>
value
<<<end>>>
"#;
        let values = parse_slot_document(raw);
        assert_eq!(values.get("first").unwrap(), "hello\nworld");
        assert_eq!(values.get("second").unwrap(), "value");
    }

    #[test]
    fn filters_prompts_by_search_text() {
        let prompt = Prompt {
            id: "tc.pir".into(),
            title: "Pre-Implementation Review".into(),
            aliases: vec!["pir".into()],
            tags: vec!["review".into()],
            description: None,
            mode: castalia_core::PromptMode::Form,
            body: "Body".into(),
            slots: vec![],
            path: PathBuf::from("tc.pir.md"),
        };
        let store = PromptStore {
            root: PathBuf::from("prompts"),
            prompts: vec![prompt],
        };
        assert_eq!(prompt_matches(&store, "pir"), vec![0]);
        assert!(prompt_matches(&store, "missing").is_empty());
    }
}
