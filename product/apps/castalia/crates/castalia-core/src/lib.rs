use std::collections::BTreeMap;
use std::fmt;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

pub const DEFAULT_PROMPT_DIR_RELATIVE: &str = ".local/share/castalia/prompts";

#[derive(Debug)]
pub enum CastaliaError {
    Io(io::Error),
    Parse {
        path: PathBuf,
        message: String,
    },
    NotFound {
        query: String,
    },
    Ambiguous {
        query: String,
        matches: Vec<String>,
    },
    MissingSlot {
        name: String,
        label: String,
    },
    InvalidInput {
        message: String,
    },
    Validation {
        root: PathBuf,
        issues: Vec<ValidationIssue>,
    },
}

impl fmt::Display for CastaliaError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Io(err) => write!(f, "I/O error: {err}"),
            Self::Parse { path, message } => {
                write!(f, "failed to parse {}: {message}", path.display())
            }
            Self::NotFound { query } => write!(f, "no prompt matched query: {query}"),
            Self::Ambiguous { query, matches } => write!(
                f,
                "query '{query}' matched multiple prompts: {}",
                matches.join(", ")
            ),
            Self::MissingSlot { name, label } => write!(f, "missing slot '{name}' ({label})"),
            Self::InvalidInput { message } => write!(f, "invalid input: {message}"),
            Self::Validation { root, issues } => write!(
                f,
                "validation failed for {} with {} issue(s)",
                root.display(),
                issues.len()
            ),
        }
    }
}

impl std::error::Error for CastaliaError {}

impl From<io::Error> for CastaliaError {
    fn from(value: io::Error) -> Self {
        Self::Io(value)
    }
}

pub type Result<T> = std::result::Result<T, CastaliaError>;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ValidationIssue {
    pub path: PathBuf,
    pub message: String,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct ValidationReport {
    pub issues: Vec<ValidationIssue>,
}

impl ValidationReport {
    pub fn is_ok(&self) -> bool {
        self.issues.is_empty()
    }

    fn push(&mut self, path: impl Into<PathBuf>, message: impl Into<String>) {
        self.issues.push(ValidationIssue {
            path: path.into(),
            message: message.into(),
        });
    }
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub enum PromptMode {
    #[default]
    Text,
    Command,
    Form,
}

impl PromptMode {
    fn parse(value: &str, path: &Path) -> Result<Self> {
        match unquote(value).trim().to_ascii_lowercase().as_str() {
            "text" => Ok(Self::Text),
            "command" => Ok(Self::Command),
            "form" => Ok(Self::Form),
            other => Err(CastaliaError::Parse {
                path: path.to_path_buf(),
                message: format!("unknown mode '{other}', expected text, command, or form"),
            }),
        }
    }
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub enum SlotSource {
    #[default]
    Manual,
    Clipboard,
}

impl SlotSource {
    fn parse(value: &str, path: &Path) -> Result<Self> {
        match unquote(value).trim().to_ascii_lowercase().as_str() {
            "manual" => Ok(Self::Manual),
            "clipboard" => Ok(Self::Clipboard),
            other => Err(CastaliaError::Parse {
                path: path.to_path_buf(),
                message: format!("unknown slot source '{other}', expected manual or clipboard"),
            }),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Slot {
    pub name: String,
    pub label: String,
    pub multiline: bool,
    pub required: bool,
    pub default: Option<String>,
    pub source: SlotSource,
}

impl Slot {
    fn new(name: String) -> Self {
        Self {
            label: name.clone(),
            name,
            multiline: false,
            required: true,
            default: None,
            source: SlotSource::Manual,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Prompt {
    pub id: String,
    pub title: String,
    pub aliases: Vec<String>,
    pub tags: Vec<String>,
    pub description: Option<String>,
    pub mode: PromptMode,
    pub body: String,
    pub slots: Vec<Slot>,
    pub path: PathBuf,
}

impl Prompt {
    pub fn search_text(&self) -> String {
        let mut parts = vec![self.id.clone(), self.title.clone()];
        parts.extend(self.aliases.iter().cloned());
        parts.extend(self.tags.iter().map(|tag| format!("#{tag}")));
        if let Some(description) = &self.description {
            parts.push(description.clone());
        }
        parts.push(body_preview(&self.body, 200));
        parts.join(" ")
    }
}

#[derive(Debug, Clone)]
pub struct PromptStore {
    pub root: PathBuf,
    pub prompts: Vec<Prompt>,
}

impl PromptStore {
    pub fn load(root: impl AsRef<Path>) -> Result<Self> {
        let root = root.as_ref().to_path_buf();
        let mut files = Vec::new();
        collect_markdown_files(&root, &mut files)?;
        let mut prompts = Vec::new();
        for path in files {
            prompts.push(parse_prompt_file(&path)?);
        }
        prompts.sort_by(|a, b| a.id.cmp(&b.id));
        Ok(Self { root, prompts })
    }

    pub fn find(&self, query: &str) -> Result<&Prompt> {
        let query = query.trim();
        if query.is_empty() {
            return Err(CastaliaError::NotFound {
                query: query.to_string(),
            });
        }

        let exact: Vec<&Prompt> = self
            .prompts
            .iter()
            .filter(|prompt| {
                prompt.id == query || prompt.aliases.iter().any(|alias| alias == query)
            })
            .collect();
        if exact.len() == 1 {
            return Ok(exact[0]);
        }
        if exact.len() > 1 {
            return Err(CastaliaError::Ambiguous {
                query: query.to_string(),
                matches: exact.iter().map(|p| p.id.clone()).collect(),
            });
        }

        let needle = query.to_ascii_lowercase();
        let contains: Vec<&Prompt> = self
            .prompts
            .iter()
            .filter(|prompt| prompt.search_text().to_ascii_lowercase().contains(&needle))
            .collect();

        match contains.len() {
            0 => Err(CastaliaError::NotFound {
                query: query.to_string(),
            }),
            1 => Ok(contains[0]),
            _ => Err(CastaliaError::Ambiguous {
                query: query.to_string(),
                matches: contains.iter().map(|p| p.id.clone()).collect(),
            }),
        }
    }
}

pub fn default_prompt_dir() -> PathBuf {
    if let Ok(value) = std::env::var("CASTALIA_PROMPT_DIR") {
        return PathBuf::from(value);
    }
    if let Ok(value) = std::env::var("XDG_DATA_HOME") {
        return PathBuf::from(value).join("castalia/prompts");
    }
    if let Ok(home) = std::env::var("HOME") {
        return PathBuf::from(home).join(DEFAULT_PROMPT_DIR_RELATIVE);
    }
    PathBuf::from("./prompts")
}

pub fn prompt_file_name_for_id(id: &str) -> String {
    format!("{id}.md")
}

pub fn is_safe_prompt_id(id: &str) -> bool {
    let id = id.trim();
    !id.is_empty()
        && !id.starts_with('.')
        && !id.ends_with('.')
        && !id.contains("..")
        && id
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, '.' | '_' | '-'))
}

pub fn validate_prompt_dir(root: impl AsRef<Path>) -> ValidationReport {
    let root = root.as_ref();
    let mut report = ValidationReport::default();
    let mut files = Vec::new();
    if let Err(err) = collect_markdown_files(root, &mut files) {
        report.push(root, format!("failed to read prompt directory: {err}"));
        return report;
    }

    let mut prompts = Vec::new();
    for path in files {
        match parse_prompt_file(&path) {
            Ok(prompt) => {
                validate_prompt(&prompt, &mut report);
                prompts.push(prompt);
            }
            Err(CastaliaError::Parse { path, message }) => {
                report.push(path, message);
            }
            Err(err) => {
                report.push(path, err.to_string());
            }
        }
    }

    validate_prompt_conflicts(&prompts, &mut report);
    report
}

pub fn validate_prompt(prompt: &Prompt, report: &mut ValidationReport) {
    if !is_safe_prompt_id(&prompt.id) {
        report.push(
            &prompt.path,
            format!(
                "id '{}' must use only ASCII letters, numbers, '.', '_', or '-' and cannot start/end with '.' or contain '..'",
                prompt.id
            ),
        );
    }
    if prompt.title.trim().is_empty() {
        report.push(&prompt.path, "title must not be empty");
    }
    if prompt.body.trim().is_empty() {
        report.push(&prompt.path, "body must not be empty");
    }

    let mut slot_names = std::collections::BTreeSet::new();
    for slot in &prompt.slots {
        if slot.name.trim().is_empty() {
            report.push(&prompt.path, "slot name must not be empty");
            continue;
        }
        if !is_safe_slot_name(&slot.name) {
            report.push(
                &prompt.path,
                format!(
                    "slot '{}' must use only ASCII letters, numbers, or '_' and cannot start with a number",
                    slot.name
                ),
            );
        }
        if !slot_names.insert(slot.name.clone()) {
            report.push(&prompt.path, format!("duplicate slot '{}'", slot.name));
        }
        let marker = format!("{{{{{}}}}}", slot.name);
        if !prompt.body.contains(&marker) && slot.required && slot.default.is_none() {
            report.push(
                &prompt.path,
                format!(
                    "required slot '{}' has no default and is not used as {} in the body",
                    slot.name, marker
                ),
            );
        }
    }

    for marker in find_slot_markers(&prompt.body) {
        if !prompt.slots.iter().any(|slot| slot.name == marker) {
            report.push(
                &prompt.path,
                format!("body references undefined slot '{{{{{marker}}}}}'"),
            );
        }
    }
}

fn validate_prompt_conflicts(prompts: &[Prompt], report: &mut ValidationReport) {
    let mut ids = std::collections::BTreeMap::<String, Vec<PathBuf>>::new();
    let mut aliases = std::collections::BTreeMap::<String, Vec<PathBuf>>::new();

    for prompt in prompts {
        ids.entry(prompt.id.clone())
            .or_default()
            .push(prompt.path.clone());
        for alias in &prompt.aliases {
            if alias.trim().is_empty() {
                report.push(&prompt.path, "alias must not be empty");
                continue;
            }
            aliases
                .entry(alias.clone())
                .or_default()
                .push(prompt.path.clone());
        }
        for tag in &prompt.tags {
            if tag.trim().is_empty() {
                report.push(&prompt.path, "tag must not be empty");
            }
        }
    }

    for (id, paths) in ids.iter().filter(|(_, paths)| paths.len() > 1) {
        for path in paths {
            report.push(path, format!("duplicate id '{id}'"));
        }
    }

    for (alias, paths) in aliases.iter().filter(|(_, paths)| paths.len() > 1) {
        for path in paths {
            report.push(path, format!("duplicate alias '{alias}'"));
        }
    }

    for prompt in prompts {
        if aliases.contains_key(&prompt.id) {
            report.push(
                &prompt.path,
                format!("id '{}' conflicts with an existing alias", prompt.id),
            );
        }
        for alias in &prompt.aliases {
            if ids.contains_key(alias) {
                report.push(
                    &prompt.path,
                    format!("alias '{alias}' conflicts with an existing id"),
                );
            }
        }
    }
}

fn is_safe_slot_name(name: &str) -> bool {
    let mut chars = name.chars();
    let Some(first) = chars.next() else {
        return false;
    };
    (first.is_ascii_alphabetic() || first == '_')
        && chars.all(|ch| ch.is_ascii_alphanumeric() || ch == '_')
}

pub fn parse_prompt_file(path: &Path) -> Result<Prompt> {
    let raw = fs::read_to_string(path)?;
    parse_prompt(&raw, path)
}

pub fn parse_prompt(raw: &str, path: &Path) -> Result<Prompt> {
    let (frontmatter, body) = split_frontmatter(raw);
    let mut prompt = Prompt {
        id: path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("untitled")
            .to_string(),
        title: path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("Untitled")
            .to_string(),
        aliases: Vec::new(),
        tags: Vec::new(),
        description: None,
        mode: PromptMode::Text,
        body: body.trim_start_matches('\n').to_string(),
        slots: Vec::new(),
        path: path.to_path_buf(),
    };

    if let Some(frontmatter) = frontmatter {
        parse_frontmatter(frontmatter, &mut prompt, path)?;
    }

    if prompt.id.trim().is_empty() {
        return Err(CastaliaError::Parse {
            path: path.to_path_buf(),
            message: "id must not be empty".to_string(),
        });
    }
    if prompt.title.trim().is_empty() {
        prompt.title = prompt.id.clone();
    }

    Ok(prompt)
}

fn split_frontmatter(raw: &str) -> (Option<&str>, &str) {
    let mut lines = raw.lines();
    if lines.next() != Some("---") {
        return (None, raw);
    }
    let after_first = &raw[4..];
    if let Some(pos) = after_first.find("\n---") {
        let frontmatter = &after_first[..pos];
        let mut body = &after_first[pos + 4..];
        if body.starts_with('\n') {
            body = &body[1..];
        }
        (Some(frontmatter), body)
    } else {
        (None, raw)
    }
}

fn parse_frontmatter(frontmatter: &str, prompt: &mut Prompt, path: &Path) -> Result<()> {
    let lines: Vec<&str> = frontmatter.lines().collect();
    let mut i = 0usize;
    while i < lines.len() {
        let line = lines[i];
        let trimmed = line.trim();
        i += 1;
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }
        if trimmed == "slots:" {
            while i < lines.len() {
                let slot_line = lines[i];
                if !slot_line.starts_with(' ') && !slot_line.starts_with('\t') {
                    break;
                }
                let slot_trimmed = slot_line.trim();
                if slot_trimmed.starts_with("- ") {
                    let first = slot_trimmed.trim_start_matches("- ").trim();
                    let mut slot = if let Some((key, value)) = split_key_value(first) {
                        if key == "name" {
                            Slot::new(unquote(value).to_string())
                        } else {
                            return Err(CastaliaError::Parse {
                                path: path.to_path_buf(),
                                message: format!("slot must start with name, got '{key}'"),
                            });
                        }
                    } else {
                        return Err(CastaliaError::Parse {
                            path: path.to_path_buf(),
                            message: "slot item must start with name".to_string(),
                        });
                    };
                    i += 1;
                    while i < lines.len() {
                        let nested = lines[i];
                        let nested_trimmed = nested.trim();
                        if nested_trimmed.starts_with("- ")
                            || (!nested.starts_with("    ") && !nested.starts_with("  "))
                        {
                            break;
                        }
                        if let Some((key, value)) = split_key_value(nested_trimmed) {
                            apply_slot_key(&mut slot, key, value, path)?;
                        } else if !nested_trimmed.is_empty() && !nested_trimmed.starts_with('#') {
                            return Err(CastaliaError::Parse {
                                path: path.to_path_buf(),
                                message: format!("invalid slot line '{nested_trimmed}'"),
                            });
                        }
                        i += 1;
                    }
                    prompt.slots.push(slot);
                    continue;
                }
                i += 1;
            }
            continue;
        }
        if let Some((key, value)) = split_key_value(trimmed) {
            match key {
                "id" => prompt.id = unquote(value).to_string(),
                "title" => prompt.title = unquote(value).to_string(),
                "aliases" => prompt.aliases = parse_array(value),
                "tags" => prompt.tags = parse_array(value),
                "description" => prompt.description = Some(unquote(value).to_string()),
                "mode" => prompt.mode = PromptMode::parse(value, path)?,
                _ => {
                    return Err(CastaliaError::Parse {
                        path: path.to_path_buf(),
                        message: format!("unknown frontmatter key '{key}'"),
                    });
                }
            }
        } else {
            return Err(CastaliaError::Parse {
                path: path.to_path_buf(),
                message: format!("invalid frontmatter line '{trimmed}'"),
            });
        }
    }
    Ok(())
}

fn apply_slot_key(slot: &mut Slot, key: &str, value: &str, path: &Path) -> Result<()> {
    match key {
        "name" => slot.name = unquote(value).to_string(),
        "label" => slot.label = unquote(value).to_string(),
        "multiline" => slot.multiline = parse_bool(value, path, key)?,
        "required" => slot.required = parse_bool(value, path, key)?,
        "default" => slot.default = Some(unquote(value).to_string()),
        "source" => slot.source = SlotSource::parse(value, path)?,
        _ => {
            return Err(CastaliaError::Parse {
                path: path.to_path_buf(),
                message: format!("unknown slot key '{key}'"),
            });
        }
    }
    Ok(())
}

fn split_key_value(line: &str) -> Option<(&str, &str)> {
    let index = line.find(':')?;
    let key = line[..index].trim();
    let value = line[index + 1..].trim();
    Some((key, value))
}

fn parse_array(value: &str) -> Vec<String> {
    let value = value.trim();
    let items = if value.starts_with('[') && value.ends_with(']') {
        &value[1..value.len() - 1]
    } else {
        value
    };

    if items.contains(',') {
        items
            .split(',')
            .map(|item| unquote(item.trim()).trim().to_string())
            .filter(|item| !item.is_empty())
            .collect()
    } else if items.is_empty() {
        Vec::new()
    } else {
        vec![unquote(items).to_string()]
    }
}

fn unquote(value: &str) -> &str {
    let value = value.trim();
    if value.len() >= 2 {
        let bytes = value.as_bytes();
        if (bytes[0] == b'\'' && bytes[value.len() - 1] == b'\'')
            || (bytes[0] == b'"' && bytes[value.len() - 1] == b'"')
        {
            return &value[1..value.len() - 1];
        }
    }
    value
}

fn parse_bool(value: &str, path: &Path, key: &str) -> Result<bool> {
    match unquote(value).trim().to_ascii_lowercase().as_str() {
        "true" | "yes" | "1" => Ok(true),
        "false" | "no" | "0" => Ok(false),
        other => Err(CastaliaError::Parse {
            path: path.to_path_buf(),
            message: format!("'{key}' must be boolean, got '{other}'"),
        }),
    }
}

fn find_slot_markers(body: &str) -> Vec<String> {
    let mut markers = Vec::new();
    let mut rest = body;
    while let Some(start) = rest.find("{{") {
        let after_start = &rest[start + 2..];
        let Some(end) = after_start.find("}}") else {
            break;
        };
        let marker = after_start[..end].trim();
        if !marker.is_empty() {
            markers.push(marker.to_string());
        }
        rest = &after_start[end + 2..];
    }
    markers
}

fn collect_markdown_files(root: &Path, out: &mut Vec<PathBuf>) -> Result<()> {
    if !root.exists() {
        return Ok(());
    }
    for entry in fs::read_dir(root)? {
        let entry = entry?;
        let path = entry.path();
        if path.is_dir() {
            collect_markdown_files(&path, out)?;
        } else if path.extension().and_then(|ext| ext.to_str()) == Some("md") {
            out.push(path);
        }
    }
    Ok(())
}

pub fn render_prompt(prompt: &Prompt, values: &BTreeMap<String, String>) -> Result<String> {
    let mut rendered = prompt.body.clone();
    for slot in &prompt.slots {
        let replacement = values
            .get(&slot.name)
            .cloned()
            .or_else(|| slot.default.clone())
            .unwrap_or_default();
        if slot.required && replacement.is_empty() {
            return Err(CastaliaError::MissingSlot {
                name: slot.name.clone(),
                label: slot.label.clone(),
            });
        }
        let marker = format!("{{{{{}}}}}", slot.name);
        rendered = rendered.replace(&marker, &replacement);
    }
    Ok(rendered)
}

pub fn body_preview(body: &str, max_chars: usize) -> String {
    let mut normalized = body
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .take(4)
        .collect::<Vec<_>>()
        .join(" / ");
    normalized = normalized.replace('\t', " ");
    if normalized.chars().count() > max_chars {
        let mut truncated = normalized
            .chars()
            .take(max_chars.saturating_sub(1))
            .collect::<String>();
        truncated.push('…');
        truncated
    } else {
        normalized
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_frontmatter_and_body() {
        let raw = r#"---
id: tc.pir
title: Pre-Implementation Review
aliases: [pir, review]
tags: [thinking-compiler, implementation]
mode: form
slots:
  - name: change
    label: 変更内容
    multiline: true
---
TC:pir

変更:
{{change}}
"#;
        let prompt = parse_prompt(raw, Path::new("tc.pir.md")).unwrap();
        assert_eq!(prompt.id, "tc.pir");
        assert_eq!(prompt.aliases, vec!["pir", "review"]);
        assert_eq!(prompt.tags, vec!["thinking-compiler", "implementation"]);
        assert_eq!(prompt.slots[0].name, "change");
        assert!(prompt.slots[0].multiline);
    }

    #[test]
    fn renders_slots() {
        let prompt = Prompt {
            id: "x".into(),
            title: "x".into(),
            aliases: vec![],
            tags: vec![],
            description: None,
            mode: PromptMode::Form,
            body: "Hello {{name}}".into(),
            slots: vec![Slot {
                name: "name".into(),
                label: "Name".into(),
                multiline: false,
                required: true,
                default: None,
                source: SlotSource::Manual,
            }],
            path: PathBuf::from("x.md"),
        };
        let mut values = BTreeMap::new();
        values.insert("name".into(), "Castalia".into());
        assert_eq!(render_prompt(&prompt, &values).unwrap(), "Hello Castalia");
    }

    #[test]
    fn parses_comma_separated_arrays_without_brackets() {
        let raw = r#"---
id: tc.pir
title: Pre-Implementation Review
aliases: pir,review
tags: implementation,review
---
Body
"#;
        let prompt = parse_prompt(raw, Path::new("tc.pir.md")).unwrap();
        assert_eq!(prompt.aliases, vec!["pir", "review"]);
        assert_eq!(prompt.tags, vec!["implementation", "review"]);
    }

    #[test]
    fn rejects_unknown_mode() {
        let raw = r#"---
id: bad
title: Bad
mode: mystery
---
Body
"#;
        let err = parse_prompt(raw, Path::new("bad.md")).unwrap_err();
        assert!(err.to_string().contains("unknown mode"));
    }

    #[test]
    fn validation_reports_undefined_slots() {
        let raw = r#"---
id: tc.test
title: Test
---
Hello {{name}}
"#;
        let prompt = parse_prompt(raw, Path::new("tc.test.md")).unwrap();
        let mut report = ValidationReport::default();
        validate_prompt(&prompt, &mut report);
        assert_eq!(report.issues.len(), 1);
        assert!(report.issues[0]
            .message
            .contains("body references undefined slot"));
    }

    #[test]
    fn validates_prompt_id_safety() {
        assert!(is_safe_prompt_id("tc.pir"));
        assert!(!is_safe_prompt_id("../secret"));
        assert!(!is_safe_prompt_id(".hidden"));
    }
}
