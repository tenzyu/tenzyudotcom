use castalia_core::{body_preview, render_prompt, CastaliaError, Prompt, PromptStore, SlotSource};
use eframe::egui;
use std::collections::BTreeMap;
use std::env;
use std::fs;
use std::io;
use std::path::PathBuf;
use std::process::Command;
use std::sync::{Arc, Mutex};

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
    let store = load_store(&options.root)?;

    if let Some(query) = &options.query {
        let prompt = store.find(query)?;
        let values = collect_slot_values_for_prompt(prompt, &options)?;
        let rendered = render_prompt(prompt, &values)?;
        return Ok(Some(LaunchResult {
            prompt_id: prompt.id.clone(),
            rendered,
        }));
    }

    let Some(selection) = run_gui_launcher(store, &options)? else {
        return Ok(None);
    };
    let prompt = &selection.prompt;
    let values = match selection.next {
        NextAction::Submit(values) => values,
        NextAction::Editor(values) => collect_missing_slots_with_editor(prompt, values)?,
    };
    let rendered = render_prompt(prompt, &values)?;
    Ok(Some(LaunchResult {
        prompt_id: prompt.id.clone(),
        rendered,
    }))
}

pub fn launch_tui(options: LaunchOptions) -> castalia_core::Result<Option<LaunchResult>> {
    let store = load_store(&options.root)?;
    let prompt = if let Some(query) = &options.query {
        store.find(query)?
    } else {
        let Some(index) = select_prompt_tui(&store)? else {
            return Ok(None);
        };
        &store.prompts[index]
    };

    let values = collect_slot_values_tui(prompt, &options)?;
    let rendered = render_prompt(prompt, &values)?;
    Ok(Some(LaunchResult {
        prompt_id: prompt.id.clone(),
        rendered,
    }))
}

fn load_store(root: &PathBuf) -> castalia_core::Result<PromptStore> {
    let store = PromptStore::load(root)?;
    if store.prompts.is_empty() {
        return Err(CastaliaError::NotFound {
            query: format!("no prompts in {}. Run `castalia init`.", root.display()),
        });
    }
    Ok(store)
}

fn collect_slot_values_for_prompt(
    prompt: &Prompt,
    options: &LaunchOptions,
) -> castalia_core::Result<BTreeMap<String, String>> {
    let values = prefilled_slot_values(prompt, options);
    if !has_missing_slots(prompt, &values) {
        return Ok(values);
    }

    match options.slot_input_mode {
        SlotInputMode::Editor => collect_missing_slots_with_editor(prompt, values),
        SlotInputMode::Ui | SlotInputMode::ClipboardFirst => {
            run_gui_slot_editor(prompt.clone(), values)?.ok_or_else(|| {
                CastaliaError::InvalidInput {
                    message: "launcher canceled".into(),
                }
            })
        }
    }
}

fn prefilled_slot_values(prompt: &Prompt, options: &LaunchOptions) -> BTreeMap<String, String> {
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
        if let Some(default) = &slot.default {
            values.insert(slot.name.clone(), default.clone());
        }
    }
    values
}

fn has_missing_slots(prompt: &Prompt, values: &BTreeMap<String, String>) -> bool {
    prompt.slots.iter().any(|slot| {
        values
            .get(&slot.name)
            .or(slot.default.as_ref())
            .map(|value| value.is_empty() && slot.required)
            .unwrap_or(true)
    })
}

fn run_gui_launcher(
    store: PromptStore,
    options: &LaunchOptions,
) -> castalia_core::Result<Option<GuiSelection>> {
    let outcome = Arc::new(Mutex::new(GuiOutcome::Cancel));
    let app = LauncherGuiApp::new(
        store,
        options.initial_values.clone(),
        options.slot_input_mode,
        options.clipboard.clone(),
        outcome.clone(),
        None,
    );
    run_egui_app(app, "Castalia")?;
    Ok(match take_outcome(outcome)? {
        GuiOutcome::Submit(selection) => Some(*selection),
        GuiOutcome::Cancel => None,
    })
}

fn run_gui_slot_editor(
    prompt: Prompt,
    values: BTreeMap<String, String>,
) -> castalia_core::Result<Option<BTreeMap<String, String>>> {
    let outcome = Arc::new(Mutex::new(GuiOutcome::Cancel));
    let store = PromptStore {
        root: PathBuf::new(),
        prompts: vec![prompt],
    };
    let app = LauncherGuiApp::new(
        store,
        values,
        SlotInputMode::Ui,
        None,
        outcome.clone(),
        Some(0),
    );
    run_egui_app(app, "Castalia slots")?;
    Ok(match take_outcome(outcome)? {
        GuiOutcome::Submit(selection) => match selection.next {
            NextAction::Submit(values) | NextAction::Editor(values) => Some(values),
        },
        GuiOutcome::Cancel => None,
    })
}

fn run_egui_app(app: LauncherGuiApp, title: &str) -> castalia_core::Result<()> {
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_inner_size([760.0, 520.0])
            .with_min_inner_size([520.0, 360.0])
            .with_resizable(true),
        ..Default::default()
    };
    if env::var_os("WAYLAND_DISPLAY").is_some() && env::var_os("DISPLAY").is_some() {
        return run_without_wayland(title, options, app);
    }
    eframe::run_native(title, options, Box::new(|_cc| Ok(Box::new(app)))).map_err(gui_open_error)
}

fn run_without_wayland(
    title: &str,
    options: eframe::NativeOptions,
    app: LauncherGuiApp,
) -> castalia_core::Result<()> {
    let wayland_display = env::var_os("WAYLAND_DISPLAY");
    let wayland_socket = env::var_os("WAYLAND_SOCKET");
    env::remove_var("WAYLAND_DISPLAY");
    env::remove_var("WAYLAND_SOCKET");
    let result = eframe::run_native(title, options, Box::new(|_cc| Ok(Box::new(app))))
        .map_err(gui_open_error);
    if let Some(value) = wayland_display {
        env::set_var("WAYLAND_DISPLAY", value);
    }
    if let Some(value) = wayland_socket {
        env::set_var("WAYLAND_SOCKET", value);
    }
    result
}

fn gui_open_error(err: eframe::Error) -> CastaliaError {
    CastaliaError::InvalidInput {
        message: format!("failed to open GUI launcher: {err}"),
    }
}

fn take_outcome(outcome: Arc<Mutex<GuiOutcome>>) -> castalia_core::Result<GuiOutcome> {
    let mut outcome = outcome.lock().map_err(|_| CastaliaError::InvalidInput {
        message: "launcher result lock was poisoned".into(),
    })?;
    Ok(std::mem::replace(&mut *outcome, GuiOutcome::Cancel))
}

struct GuiSelection {
    prompt: Prompt,
    next: NextAction,
}

enum NextAction {
    Submit(BTreeMap<String, String>),
    Editor(BTreeMap<String, String>),
}

enum GuiOutcome {
    Submit(Box<GuiSelection>),
    Cancel,
}

#[derive(Clone)]
enum LauncherScreen {
    Search,
    Slots { prompt_index: usize },
}

#[derive(Clone)]
struct LauncherGuiApp {
    store: PromptStore,
    query: String,
    selected: usize,
    values: BTreeMap<String, String>,
    slot_input_mode: SlotInputMode,
    clipboard: Option<String>,
    outcome: Arc<Mutex<GuiOutcome>>,
    screen: LauncherScreen,
    search_focused: bool,
    first_slot_focused: bool,
    fonts_configured: bool,
    error: Option<String>,
}

impl LauncherGuiApp {
    fn new(
        store: PromptStore,
        values: BTreeMap<String, String>,
        slot_input_mode: SlotInputMode,
        clipboard: Option<String>,
        outcome: Arc<Mutex<GuiOutcome>>,
        initial_prompt_index: Option<usize>,
    ) -> Self {
        let screen = if let Some(prompt_index) = initial_prompt_index {
            LauncherScreen::Slots { prompt_index }
        } else {
            LauncherScreen::Search
        };
        Self {
            store,
            query: String::new(),
            selected: 0,
            values,
            slot_input_mode,
            clipboard,
            outcome,
            screen,
            search_focused: false,
            first_slot_focused: false,
            fonts_configured: false,
            error: None,
        }
    }

    fn prompt_matches(&self) -> Vec<usize> {
        prompt_matches(&self.store, &self.query)
    }

    fn select_prompt(&mut self, prompt_index: usize, ctx: &egui::Context) {
        let prompt = self.store.prompts[prompt_index].clone();
        let mut values = self.values.clone();
        let options = LaunchOptions {
            root: PathBuf::new(),
            query: None,
            initial_values: values.clone(),
            slot_input_mode: self.slot_input_mode,
            clipboard: self.clipboard.clone(),
        };
        values = prefilled_slot_values(&prompt, &options);

        if matches!(self.slot_input_mode, SlotInputMode::Editor) {
            self.submit(
                GuiSelection {
                    prompt,
                    next: NextAction::Editor(values),
                },
                ctx,
            );
            return;
        }

        if prompt.slots.is_empty() || !has_missing_slots(&prompt, &values) {
            self.submit(
                GuiSelection {
                    prompt,
                    next: NextAction::Submit(values),
                },
                ctx,
            );
            return;
        }

        self.values = values;
        self.ensure_slot_values(prompt_index);
        self.screen = LauncherScreen::Slots { prompt_index };
        self.first_slot_focused = false;
        self.error = None;
    }

    fn ensure_slot_values(&mut self, prompt_index: usize) {
        let prompt = &self.store.prompts[prompt_index];
        for slot in &prompt.slots {
            self.values.entry(slot.name.clone()).or_insert_with(|| {
                slot.default
                    .clone()
                    .or_else(|| {
                        if matches!(slot.source, SlotSource::Clipboard) {
                            self.clipboard.clone()
                        } else {
                            None
                        }
                    })
                    .unwrap_or_default()
            });
        }
    }

    fn submit_slots(&mut self, prompt_index: usize, use_editor: bool, ctx: &egui::Context) {
        let prompt = self.store.prompts[prompt_index].clone();
        if !use_editor {
            match render_prompt(&prompt, &self.values) {
                Ok(_) => {}
                Err(err) => {
                    self.error = Some(err.to_string());
                    return;
                }
            }
        }
        self.submit(
            GuiSelection {
                prompt,
                next: if use_editor {
                    NextAction::Editor(self.values.clone())
                } else {
                    NextAction::Submit(self.values.clone())
                },
            },
            ctx,
        );
    }

    fn submit(&mut self, selection: GuiSelection, ctx: &egui::Context) {
        if let Ok(mut outcome) = self.outcome.lock() {
            *outcome = GuiOutcome::Submit(Box::new(selection));
        }
        ctx.send_viewport_cmd(egui::ViewportCommand::Close);
    }

    fn cancel(&mut self, ctx: &egui::Context) {
        ctx.send_viewport_cmd(egui::ViewportCommand::Close);
    }

    fn draw_search(&mut self, ctx: &egui::Context, ui: &mut egui::Ui) {
        if ctx.input(|input| input.key_pressed(egui::Key::Escape)) {
            self.cancel(ctx);
            return;
        }

        let matches = self.prompt_matches();
        if self.selected >= matches.len() {
            self.selected = matches.len().saturating_sub(1);
        }

        if ctx.input(|input| input.key_pressed(egui::Key::ArrowDown))
            && self.selected + 1 < matches.len()
        {
            self.selected += 1;
        }
        if ctx.input(|input| input.key_pressed(egui::Key::ArrowUp)) {
            self.selected = self.selected.saturating_sub(1);
        }
        if ctx.input(|input| input.key_pressed(egui::Key::Enter)) {
            if let Some(prompt_index) = matches.get(self.selected).copied() {
                self.select_prompt(prompt_index, ctx);
                return;
            }
        }

        ui.vertical_centered_justified(|ui| {
            ui.heading("Castalia");
        });
        ui.add_space(8.0);
        let search = ui.add(
            egui::TextEdit::singleline(&mut self.query)
                .hint_text("Search prompts")
                .desired_width(f32::INFINITY),
        );
        if !self.search_focused {
            search.request_focus();
            self.search_focused = true;
        }
        ui.add_space(8.0);
        ui.label(egui::RichText::new("Enter selects, Escape cancels").color(secondary_text()));
        ui.separator();

        egui::ScrollArea::vertical().show(ui, |ui| {
            if matches.is_empty() {
                ui.add_space(32.0);
                ui.centered_and_justified(|ui| {
                    ui.label(egui::RichText::new("No prompts matched").color(secondary_text()));
                });
                return;
            }

            for (row, prompt_index) in matches.iter().take(32).enumerate() {
                let prompt = &self.store.prompts[*prompt_index];
                let selected = row == self.selected;
                let fill = if selected {
                    egui::Color32::from_rgb(55, 71, 92)
                } else {
                    egui::Color32::TRANSPARENT
                };
                let response = egui::Frame::new()
                    .fill(fill)
                    .inner_margin(egui::Margin::symmetric(10, 8))
                    .show(ui, |ui| {
                        ui.horizontal(|ui| {
                            ui.vertical(|ui| {
                                ui.label(egui::RichText::new(&prompt.title).strong());
                                ui.label(
                                    egui::RichText::new(body_preview(&prompt.body, 110))
                                        .color(secondary_text()),
                                );
                            });
                            ui.with_layout(
                                egui::Layout::right_to_left(egui::Align::Center),
                                |ui| {
                                    ui.label(
                                        egui::RichText::new(&prompt.id)
                                            .monospace()
                                            .color(secondary_text()),
                                    );
                                },
                            );
                        });
                    })
                    .response;
                if response.clicked() {
                    self.selected = row;
                    self.select_prompt(*prompt_index, ctx);
                    return;
                }
                ui.add_space(4.0);
            }
        });
    }

    fn draw_slots(&mut self, prompt_index: usize, ctx: &egui::Context, ui: &mut egui::Ui) {
        if ctx.input(|input| input.key_pressed(egui::Key::Escape)) {
            self.cancel(ctx);
            return;
        }
        if ctx.input(|input| input.modifiers.command && input.key_pressed(egui::Key::Enter)) {
            self.submit_slots(prompt_index, false, ctx);
            return;
        }

        self.ensure_slot_values(prompt_index);
        let prompt = self.store.prompts[prompt_index].clone();
        ui.heading(&prompt.title);
        ui.label(egui::RichText::new(body_preview(&prompt.body, 140)).color(secondary_text()));
        ui.add_space(8.0);

        if let Some(error) = &self.error {
            ui.label(egui::RichText::new(error).color(egui::Color32::from_rgb(245, 120, 120)));
            ui.add_space(6.0);
        }

        egui::ScrollArea::vertical().show(ui, |ui| {
            for (index, slot) in prompt.slots.iter().enumerate() {
                ui.label(egui::RichText::new(&slot.label).strong());
                ui.label(
                    egui::RichText::new(format!(
                        "{}{}",
                        slot.name,
                        if slot.required { " *" } else { "" }
                    ))
                    .monospace()
                    .color(secondary_text()),
                );
                let value = self.values.entry(slot.name.clone()).or_default();
                let response = if slot.multiline {
                    ui.add(
                        egui::TextEdit::multiline(value)
                            .desired_rows(5)
                            .desired_width(f32::INFINITY),
                    )
                } else {
                    ui.add(egui::TextEdit::singleline(value).desired_width(f32::INFINITY))
                };
                if index == 0 && !self.first_slot_focused {
                    response.request_focus();
                    self.first_slot_focused = true;
                }
                ui.add_space(10.0);
            }
        });

        ui.separator();
        ui.horizontal(|ui| {
            if ui.button("Copy").clicked() {
                self.submit_slots(prompt_index, false, ctx);
            }
            if ui.button("Open editor").clicked() {
                self.submit_slots(prompt_index, true, ctx);
            }
            if ui.button("Cancel").clicked() {
                self.cancel(ctx);
            }
            ui.label(egui::RichText::new("Ctrl+Enter copies").color(secondary_text()));
        });
    }
}

impl eframe::App for LauncherGuiApp {
    fn ui(&mut self, ui: &mut egui::Ui, _frame: &mut eframe::Frame) {
        let ctx = ui.ctx().clone();
        if !self.fonts_configured {
            configure_fonts(&ctx);
            self.fonts_configured = true;
        }
        configure_style(&ctx);
        egui::CentralPanel::default()
            .frame(egui::Frame::new().fill(egui::Color32::from_rgb(24, 28, 33)))
            .show_inside(ui, |ui| {
                ui.set_width(ui.available_width());
                match self.screen {
                    LauncherScreen::Search => self.draw_search(&ctx, ui),
                    LauncherScreen::Slots { prompt_index } => {
                        self.draw_slots(prompt_index, &ctx, ui)
                    }
                }
            });
    }
}

fn configure_style(ctx: &egui::Context) {
    let mut visuals = egui::Visuals::dark();
    visuals.panel_fill = egui::Color32::from_rgb(24, 28, 33);
    visuals.window_fill = egui::Color32::from_rgb(24, 28, 33);
    visuals.extreme_bg_color = egui::Color32::from_rgb(18, 21, 25);
    visuals.widgets.inactive.bg_fill = egui::Color32::from_rgb(34, 39, 46);
    visuals.widgets.hovered.bg_fill = egui::Color32::from_rgb(45, 55, 68);
    visuals.widgets.active.bg_fill = egui::Color32::from_rgb(58, 75, 99);
    visuals.selection.bg_fill = egui::Color32::from_rgb(70, 96, 130);
    ctx.set_visuals(visuals);
}

fn configure_fonts(ctx: &egui::Context) {
    let Some(font_bytes) = load_cjk_font() else {
        return;
    };
    let mut fonts = egui::FontDefinitions::default();
    let font_name = "castalia-cjk".to_string();
    fonts.font_data.insert(
        font_name.clone(),
        Arc::new(egui::FontData::from_owned(font_bytes)),
    );
    for family in [egui::FontFamily::Proportional, egui::FontFamily::Monospace] {
        fonts
            .families
            .entry(family)
            .or_default()
            .push(font_name.clone());
    }
    ctx.set_fonts(fonts);
}

fn load_cjk_font() -> Option<Vec<u8>> {
    for path in cjk_font_candidates() {
        if let Ok(bytes) = fs::read(&path) {
            return Some(bytes);
        }
    }
    None
}

fn cjk_font_candidates() -> Vec<PathBuf> {
    let mut paths = Vec::new();
    if let Some(path) = env::var_os("CASTALIA_GUI_FONT_PATH") {
        paths.push(PathBuf::from(path));
    }
    if let Some(path) = fc_match_font("Noto Sans CJK JP") {
        paths.push(path);
    }
    if let Some(path) = fc_match_font("Noto Sans JP") {
        paths.push(path);
    }
    paths.extend(
        [
            "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
            "/usr/share/fonts/opentype/noto/NotoSansCJK-VF.otf.ttc",
            "/usr/share/fonts/opentype/noto/NotoSansJP-Regular.otf",
            "/usr/share/fonts/opentype/source-han-sans/SourceHanSans-Regular.ttc",
            "/run/current-system/sw/share/fonts/opentype/noto-cjk/NotoSansCJK-VF.otf.ttc",
            "/run/current-system/sw/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        ]
        .into_iter()
        .map(PathBuf::from),
    );
    paths
}

fn fc_match_font(family: &str) -> Option<PathBuf> {
    let output = Command::new("fc-match")
        .args(["-f", "%{file}\n", family])
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let raw = String::from_utf8_lossy(&output.stdout);
    let path = raw.lines().next()?.trim();
    if path.is_empty() {
        None
    } else {
        Some(PathBuf::from(path))
    }
}

fn secondary_text() -> egui::Color32 {
    egui::Color32::from_rgb(170, 181, 194)
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

fn collect_missing_slots_with_editor(
    prompt: &Prompt,
    mut values: BTreeMap<String, String>,
) -> castalia_core::Result<BTreeMap<String, String>> {
    let missing = prompt
        .slots
        .iter()
        .filter(|slot| !values.contains_key(&slot.name) || values[&slot.name].is_empty())
        .collect::<Vec<_>>();
    if missing.is_empty() {
        return Ok(values);
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
    Ok(values)
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

fn select_prompt_tui(store: &PromptStore) -> castalia_core::Result<Option<usize>> {
    let mut query = String::new();
    eprintln!("Castalia launch-tui");
    eprintln!("Search query, empty selects first prompt, Ctrl-D cancels:");
    let read = io::stdin().read_line(&mut query)?;
    if read == 0 {
        return Ok(None);
    }
    let matches = prompt_matches(store, &query);
    Ok(matches.first().copied())
}

fn collect_slot_values_tui(
    prompt: &Prompt,
    options: &LaunchOptions,
) -> castalia_core::Result<BTreeMap<String, String>> {
    let values = prefilled_slot_values(prompt, options);
    match options.slot_input_mode {
        SlotInputMode::Editor => collect_missing_slots_with_editor(prompt, values),
        SlotInputMode::Ui | SlotInputMode::ClipboardFirst => {
            collect_missing_slots_with_stdin(prompt, values)
        }
    }
}

fn collect_missing_slots_with_stdin(
    prompt: &Prompt,
    mut values: BTreeMap<String, String>,
) -> castalia_core::Result<BTreeMap<String, String>> {
    for slot in &prompt.slots {
        if values.contains_key(&slot.name) && !values[&slot.name].is_empty() {
            continue;
        }
        eprintln!("{} ({})", slot.label, slot.name);
        let mut value = String::new();
        io::stdin().read_line(&mut value)?;
        values.insert(slot.name.clone(), value.trim_end_matches('\n').to_string());
    }
    Ok(values)
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
